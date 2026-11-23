import json
import random
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.core.dependencies import get_db, get_optional_user, get_current_user
from app.core.datetime_utils import parse_local_to_utc, format_iso_utc_z
from app.core.parameter_config import (
    validate_parameter_value, PARAMETER_CONFIGS,
    validate_india_coordinates, format_coordinates_cardinal
)
from app.models.user import User
from app.models.water_sample import WaterSample
from app.models.water_parameter import WaterParameter
from app.models.water_source import WaterSource
from app.models.analysis_result import AnalysisResult
from app.models.anomaly_record import AnomalyRecord
from app.models.alert import Alert
from app.models.recommendation import Recommendation
from app.schemas.sample import (
    WaterSampleCreate, WaterSampleUpdate, WaterSampleResponse, WaterSampleDetailResponse,
    WaterParameterResponse, BulkDeleteRequest, BulkDeleteResponse
)
from app.services.analysis_service import run_full_sample_analysis

router = APIRouter(prefix="/samples", tags=["Water Samples"])

def generate_sample_id(db: Session) -> str:
    all_samples = db.query(WaterSample.sample_id).all()
    max_num = 0
    for (s_id,) in all_samples:
        if s_id and s_id.upper().startswith("WQ"):
            suffix = s_id[2:]
            if suffix.isdigit():
                max_num = max(max_num, int(suffix))
    next_num = max(max_num + 1, db.query(WaterSample).count() + 1, 1)
    sample_id = f"WQ{next_num:03d}"
    while db.query(WaterSample).filter(WaterSample.sample_id == sample_id).first():
        next_num += 1
        sample_id = f"WQ{next_num:03d}"
    return sample_id

@router.get("/next-id", response_model=Dict[str, str])
def get_next_sample_id(db: Session = Depends(get_db)):
    """Generate and return the next available unique sample ID."""
    return {"next_sample_id": generate_sample_id(db)}

@router.get("/check-id/{sample_id_to_check}")
def check_sample_id_uniqueness(sample_id_to_check: str, db: Session = Depends(get_db)):
    """Check if a sample ID is already in use."""
    code = sample_id_to_check.strip().upper()
    existing = db.query(WaterSample).filter(WaterSample.sample_id == code).first()
    return {
        "sample_id": code,
        "is_available": existing is None,
        "message": f"Sample ID '{code}' is available." if existing is None else f"Sample ID '{code}' already exists in database. Please choose a different unique ID or leave empty to auto-generate."
    }

@router.post("/", response_model=WaterSampleDetailResponse, status_code=status.HTTP_201_CREATED)
def create_sample(
    sample_in: WaterSampleCreate,
    auto_analyze: bool = Query(True, description="Automatically trigger quality and anomaly analysis"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # 1. Parameter Physical Range Validation
    p_in = sample_in.parameters
    param_dict_raw = {
        "ph": p_in.ph,
        "turbidity": p_in.turbidity,
        "temperature": p_in.temperature,
        "dissolved_oxygen": p_in.dissolved_oxygen,
        "tds": p_in.tds,
        "electrical_conductivity": p_in.electrical_conductivity,
        "hardness": p_in.hardness,
        "chloramines": p_in.chloramines,
        "sulfate": p_in.sulfate,
        "organic_carbon": p_in.organic_carbon
    }

    for p_key, p_val in param_dict_raw.items():
        is_val, err_msg, _ = validate_parameter_value(p_key, p_val)
        if not is_val and err_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parameter Validation Failed: {err_msg}"
            )

    # 2. Geographical Coordinate Bounding Box Validation (India)
    is_geo_valid, geo_err = validate_india_coordinates(sample_in.latitude, sample_in.longitude)
    if not is_geo_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Geographical Coordinate Validation Failed: {geo_err}"
        )

    # 3. Sample ID resolution & uniqueness enforcement
    sample_id = sample_in.sample_id
    if not sample_id or sample_id.strip() == "":
        sample_id = generate_sample_id(db)
    else:
        sample_id = sample_id.strip().upper()
        if db.query(WaterSample).filter(WaterSample.sample_id == sample_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample with ID '{sample_id}' already exists. Silent overwriting is prevented. Please provide a different unique ID or leave empty to auto-generate."
            )

    # 3. Resolve or create water source location
    source = db.query(WaterSource).filter(WaterSource.name == sample_in.water_source_name).first()
    if not source:
        source = WaterSource(
            name=sample_in.water_source_name,
            location_name=sample_in.location_name,
            latitude=sample_in.latitude,
            longitude=sample_in.longitude
        )
        db.add(source)
        db.flush()

    # 4. Parse user-entered local date/time into strict UTC
    tz_name = sample_in.timezone or "Asia/Kolkata"
    collection_utc = parse_local_to_utc(sample_in.collection_date, tz_name)

    new_sample = WaterSample(
        sample_id=sample_id,
        water_source_id=source.id,
        water_source_name=sample_in.water_source_name,
        location_name=sample_in.location_name,
        latitude=sample_in.latitude if sample_in.latitude is not None else source.latitude,
        longitude=sample_in.longitude if sample_in.longitude is not None else source.longitude,
        timezone=tz_name,
        collection_date=collection_utc,
        notes=sample_in.notes,
        created_by_id=current_user.id if current_user else None
    )
    db.add(new_sample)
    db.flush()

    new_param = WaterParameter(
        sample_id=new_sample.id,
        ph=p_in.ph,
        turbidity=p_in.turbidity,
        temperature=p_in.temperature,
        dissolved_oxygen=p_in.dissolved_oxygen,
        tds=p_in.tds,
        electrical_conductivity=p_in.electrical_conductivity,
        hardness=p_in.hardness,
        chloramines=p_in.chloramines,
        sulfate=p_in.sulfate,
        organic_carbon=p_in.organic_carbon
    )
    db.add(new_param)
    db.commit()
    db.refresh(new_sample)

    if auto_analyze:
        try:
            run_full_sample_analysis(new_sample.id, db)
            db.refresh(new_sample)
        except Exception:
            pass

    return format_sample_detail(new_sample)

@router.get("/", response_model=List[WaterSampleResponse])
def list_samples(
    location: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(WaterSample).options(
        joinedload(WaterSample.parameters),
        joinedload(WaterSample.analysis)
    )
    if location and location.strip():
        query = query.filter(WaterSample.location_name.ilike(f"%{location.strip()}%"))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (WaterSample.sample_id.ilike(term)) |
            (WaterSample.water_source_name.ilike(term)) |
            (WaterSample.location_name.ilike(term))
        )
    if category and category.strip():
        query = query.join(AnalysisResult, WaterSample.id == AnalysisResult.sample_id).filter(
            AnalysisResult.is_current == True,
            AnalysisResult.predicted_category == category.strip()
        )

    samples = query.order_by(desc(WaterSample.collection_date)).offset(offset).limit(limit).all()
    return samples

@router.get("/{sample_id_or_code}", response_model=WaterSampleDetailResponse)
def get_sample_detail(sample_id_or_code: str, db: Session = Depends(get_db)):
    sample = None
    if sample_id_or_code.isdigit():
        sample = db.query(WaterSample).filter(WaterSample.id == int(sample_id_or_code)).first()
    if not sample:
        sample = db.query(WaterSample).filter(WaterSample.sample_id == sample_id_or_code.upper()).first()
    
    if not sample:
        raise HTTPException(status_code=404, detail="Water sample not found")

    return format_sample_detail(sample)

@router.put("/{sample_id_or_code}", response_model=WaterSampleDetailResponse)
def update_sample(
    sample_id_or_code: str,
    sample_update: WaterSampleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sample = None
    if sample_id_or_code.isdigit():
        sample = db.query(WaterSample).filter(WaterSample.id == int(sample_id_or_code)).first()
    if not sample:
        sample = db.query(WaterSample).filter(WaterSample.sample_id == sample_id_or_code.upper()).first()

    if not sample:
        raise HTTPException(status_code=404, detail="Water sample not found")

    if sample_update.water_source_name:
        sample.water_source_name = sample_update.water_source_name
    if sample_update.location_name:
        sample.location_name = sample_update.location_name
    if sample_update.latitude is not None:
        sample.latitude = sample_update.latitude
    if sample_update.longitude is not None:
        sample.longitude = sample_update.longitude
    if sample_update.timezone:
        sample.timezone = sample_update.timezone
    if sample_update.collection_date:
        tz = sample_update.timezone or sample.timezone
        sample.collection_date = parse_local_to_utc(sample_update.collection_date, tz)
    if sample_update.notes is not None:
        sample.notes = sample_update.notes

    if sample_update.parameters:
        p = sample.parameters
        p_in = sample_update.parameters
        p.ph = p_in.ph
        p.turbidity = p_in.turbidity
        p.temperature = p_in.temperature
        p.dissolved_oxygen = p_in.dissolved_oxygen
        p.tds = p_in.tds
        p.electrical_conductivity = p_in.electrical_conductivity
        p.hardness = p_in.hardness
        p.chloramines = p_in.chloramines
        p.sulfate = p_in.sulfate
        p.organic_carbon = p_in.organic_carbon

    sample.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(sample)

    return format_sample_detail(sample)

@router.post("/bulk-delete", response_model=BulkDeleteResponse, status_code=status.HTTP_200_OK)
def bulk_delete_samples(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Delete multiple water samples by ID or sample code in one transaction."""
    if not payload.sample_ids:
        return {"deleted_count": 0, "message": "No sample IDs provided."}

    deleted_count = 0
    for id_or_code in payload.sample_ids:
        sample = None
        s_val = str(id_or_code).strip()
        if s_val.isdigit():
            sample = db.query(WaterSample).filter(WaterSample.id == int(s_val)).first()
        if not sample:
            sample = db.query(WaterSample).filter(WaterSample.sample_id == s_val.upper()).first()
        if sample:
            db.delete(sample)
            deleted_count += 1

    db.commit()
    return {"deleted_count": deleted_count, "message": f"Successfully deleted {deleted_count} sample(s)."}

@router.delete("/{sample_id_or_code}", status_code=status.HTTP_200_OK)
def delete_sample(
    sample_id_or_code: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    sample = None
    if sample_id_or_code.isdigit():
        sample = db.query(WaterSample).filter(WaterSample.id == int(sample_id_or_code)).first()
    if not sample:
        sample = db.query(WaterSample).filter(WaterSample.sample_id == sample_id_or_code.upper()).first()

    if not sample:
        raise HTTPException(status_code=404, detail="Water sample not found")

    code = sample.sample_id
    db.delete(sample)
    db.commit()
    return {"message": f"Sample {code} deleted successfully."}

def format_sample_detail(sample: WaterSample) -> Dict[str, Any]:
    a = sample.analysis
    analysis_dict = None
    if a:
        obs = json.loads(a.observations_json) if a.observations_json else []
        recs = json.loads(a.recommendations_json) if a.recommendations_json else []
        probs = json.loads(a.probabilities_json) if a.probabilities_json else {}
        steps = json.loads(a.decision_steps_json) if a.decision_steps_json else []
        sub_indices = json.loads(a.sub_indices_json) if a.sub_indices_json else {}

        matrix = json.loads(a.classification_matrix_json) if getattr(a, "classification_matrix_json", None) else None

        analysis_dict = {
            "id": a.id,
            "sample_id": a.sample_id,
            "analysis_version": a.analysis_version,
            "is_current": a.is_current,
            "predicted_category": a.predicted_category,
            "confidence_score": a.confidence_score,
            "confidence_type": a.confidence_type,
            "model_used": a.model_used,
            "model_version": a.model_version,
            "wqi_score": a.wqi_score,
            "wqi_version": a.wqi_version,
            "is_anomaly": a.is_anomaly,
            "anomaly_score": a.anomaly_score,
            "raw_decision_score": a.raw_decision_score,
            "anomaly_threshold": a.anomaly_threshold,
            "severity": a.severity,
            "summary": a.summary,
            "decision_explanation": a.decision_explanation,
            "decision_steps": steps,
            "classification_matrix": matrix,
            "observations": obs,
            "sub_indices": sub_indices,
            "recommendations": recs,
            "probabilities": probs,
            "created_at": format_iso_utc_z(a.created_at)
        }

    # Format analyses history
    analyses_history = []
    for hist in getattr(sample, "analyses", []):
        analyses_history.append({
            "id": hist.id,
            "analysis_version": hist.analysis_version,
            "is_current": hist.is_current,
            "predicted_category": hist.predicted_category,
            "confidence_score": hist.confidence_score,
            "confidence_type": hist.confidence_type,
            "model_used": hist.model_used,
            "wqi_score": hist.wqi_score,
            "is_anomaly": hist.is_anomaly,
            "severity": hist.severity,
            "created_at": format_iso_utc_z(hist.created_at)
        })

    anomalies_list = []
    for an in sample.anomalies:
        abn = json.loads(an.abnormal_parameters_json) if an.abnormal_parameters_json else []
        anomalies_list.append({
            "id": an.id,
            "sample_id": an.sample_id,
            "is_anomaly": an.is_anomaly,
            "anomaly_score": an.anomaly_score,
            "severity": an.severity,
            "detected_method": an.detected_method,
            "abnormal_parameters": abn,
            "notes": an.notes,
            "created_at": format_iso_utc_z(an.created_at)
        })

    alerts_list = []
    for al in sample.alerts:
        alerts_list.append({
            "id": al.id,
            "alert_id": al.alert_id,
            "sample_id": al.sample_id,
            "location_name": al.location_name,
            "abnormal_parameter": al.abnormal_parameter,
            "measured_value": al.measured_value,
            "threshold_value": al.threshold_value,
            "severity": al.severity,
            "alert_message": al.alert_message,
            "suggested_action": al.suggested_action,
            "status": al.status,
            "created_at": format_iso_utc_z(al.created_at),
            "updated_at": format_iso_utc_z(al.updated_at)
        })

    recs_list = []
    for r in sample.recommendations:
        recs_list.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "priority": r.priority,
            "created_at": format_iso_utc_z(r.created_at)
        })

    return {
        "id": sample.id,
        "sample_id": sample.sample_id,
        "water_source_id": sample.water_source_id,
        "water_source_name": sample.water_source_name,
        "location_name": sample.location_name,
        "latitude": sample.latitude,
        "longitude": sample.longitude,
        "timezone": getattr(sample, "timezone", "Asia/Kolkata"),
        "collection_date": format_iso_utc_z(sample.collection_date),
        "notes": sample.notes,
        "created_by_id": sample.created_by_id,
        "created_at": format_iso_utc_z(sample.created_at),
        "updated_at": format_iso_utc_z(sample.updated_at),
        "parameters": sample.parameters,
        "analysis": analysis_dict,
        "analyses_history": analyses_history,
        "anomalies": anomalies_list,
        "alerts": alerts_list,
        "recommendations": recs_list
    }

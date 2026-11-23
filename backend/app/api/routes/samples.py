import json
import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.dependencies import get_db, get_optional_user, get_current_user
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
    WaterParameterResponse
)
from app.services.analysis_service import run_full_sample_analysis

router = APIRouter(prefix="/samples", tags=["Water Samples"])

def generate_sample_id(db: Session) -> str:
    count = db.query(WaterSample).count() + 1
    sample_id = f"WQ{count:03d}"
    # Verify uniqueness
    while db.query(WaterSample).filter(WaterSample.sample_id == sample_id).first():
        count += 1
        sample_id = f"WQ{count:03d}"
    return sample_id

@router.post("/", response_model=WaterSampleDetailResponse, status_code=status.HTTP_201_CREATED)
def create_sample(
    sample_in: WaterSampleCreate,
    auto_analyze: bool = Query(True, description="Automatically trigger quality and anomaly analysis"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # Ensure sample ID
    sample_id = sample_in.sample_id
    if not sample_id or sample_id.strip() == "":
        sample_id = generate_sample_id(db)
    else:
        sample_id = sample_id.strip().upper()
        if db.query(WaterSample).filter(WaterSample.sample_id == sample_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample with ID '{sample_id}' already exists."
            )

    # Resolve or create water source location
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

    new_sample = WaterSample(
        sample_id=sample_id,
        water_source_id=source.id,
        water_source_name=sample_in.water_source_name,
        location_name=sample_in.location_name,
        latitude=sample_in.latitude if sample_in.latitude is not None else source.latitude,
        longitude=sample_in.longitude if sample_in.longitude is not None else source.longitude,
        collection_date=sample_in.collection_date or datetime.utcnow(),
        notes=sample_in.notes,
        created_by_id=current_user.id if current_user else None
    )
    db.add(new_sample)
    db.flush()

    p_in = sample_in.parameters
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
        except Exception as e:
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
    query = db.query(WaterSample)
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
        query = query.join(AnalysisResult).filter(AnalysisResult.predicted_category == category.strip())

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
    if sample_update.collection_date:
        sample.collection_date = sample_update.collection_date
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

    # Re-analyze with updated values
    run_full_sample_analysis(sample.id, db)
    db.refresh(sample)

    return format_sample_detail(sample)

@router.delete("/{sample_id_or_code}", status_code=status.HTTP_200_OK)
def delete_sample(
    sample_id_or_code: str,
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

    db.delete(sample)
    db.commit()
    return {"message": f"Sample {sample.sample_id} successfully deleted"}

def format_sample_detail(sample: WaterSample) -> dict:
    analysis_dict = None
    if sample.analysis:
        a = sample.analysis
        obs = []
        recs = []
        probs = {}
        try:
            if a.observations_json:
                obs = json.loads(a.observations_json)
        except Exception:
            pass
        try:
            if a.recommendations_json:
                recs = json.loads(a.recommendations_json)
        except Exception:
            pass
        try:
            if a.probabilities_json:
                probs = json.loads(a.probabilities_json)
        except Exception:
            pass

        analysis_dict = {
            "id": a.id,
            "sample_id": a.sample_id,
            "predicted_category": a.predicted_category,
            "confidence_score": a.confidence_score,
            "model_used": a.model_used,
            "wqi_score": a.wqi_score,
            "summary": a.summary,
            "observations": obs,
            "recommendations": recs,
            "probabilities": probs,
            "created_at": a.created_at
        }

    anomalies_list = []
    for an in sample.anomalies:
        abn = []
        try:
            if an.abnormal_parameters_json:
                abn = json.loads(an.abnormal_parameters_json)
        except Exception:
            pass
        anomalies_list.append({
            "id": an.id,
            "sample_id": an.sample_id,
            "is_anomaly": an.is_anomaly,
            "anomaly_score": an.anomaly_score,
            "severity": an.severity,
            "detected_method": an.detected_method,
            "abnormal_parameters": abn,
            "notes": an.notes,
            "created_at": an.created_at
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
            "created_at": al.created_at,
            "updated_at": al.updated_at
        })

    recs_list = []
    for r in sample.recommendations:
        recs_list.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "priority": r.priority,
            "created_at": r.created_at
        })

    return {
        "id": sample.id,
        "sample_id": sample.sample_id,
        "water_source_id": sample.water_source_id,
        "water_source_name": sample.water_source_name,
        "location_name": sample.location_name,
        "latitude": sample.latitude,
        "longitude": sample.longitude,
        "collection_date": sample.collection_date,
        "notes": sample.notes,
        "created_by_id": sample.created_by_id,
        "created_at": sample.created_at,
        "updated_at": sample.updated_at,
        "parameters": sample.parameters,
        "analysis": analysis_dict,
        "anomalies": anomalies_list,
        "alerts": alerts_list,
        "recommendations": recs_list
    }

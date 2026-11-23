import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.water_sample import WaterSample
from app.models.analysis_result import AnalysisResult
from app.core.parameter_config import PARAMETER_CONFIGS
from app.schemas.analysis import (
    AnalysisResultResponse, SingleAnalysisRequest, BatchAnalysisRequest,
    AnalysisComparisonResponse
)
from app.services.analysis_service import run_full_sample_analysis

router = APIRouter(prefix="/analysis", tags=["Water Quality Analysis"])

def format_analysis_response(a: AnalysisResult) -> Dict[str, Any]:
    """Helper to convert an AnalysisResult model into the schema response."""
    obs = json.loads(a.observations_json) if a.observations_json else []
    recs = json.loads(a.recommendations_json) if a.recommendations_json else []
    probs = json.loads(a.probabilities_json) if a.probabilities_json else {}
    steps = json.loads(a.decision_steps_json) if a.decision_steps_json else []
    sub_indices = json.loads(a.sub_indices_json) if a.sub_indices_json else {}

    return {
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
        "observations": obs,
        "sub_indices": sub_indices,
        "recommendations": recs,
        "probabilities": probs,
        "created_at": a.created_at
    }

@router.get("/parameters/config", status_code=status.HTTP_200_OK)
def get_parameter_configurations():
    """Returns the centralized water quality parameter configurations and screening baselines."""
    return PARAMETER_CONFIGS

@router.post("/{sample_id_or_code}", response_model=AnalysisResultResponse)
def analyze_single_sample(
    sample_id_or_code: str,
    req: SingleAnalysisRequest = SingleAnalysisRequest(),
    db: Session = Depends(get_db)
):
    """Executes or re-runs full analysis on a water sample, creating a new versioned record."""
    sample = None
    if sample_id_or_code.isdigit():
        sample = db.query(WaterSample).filter(WaterSample.id == int(sample_id_or_code)).first()
    if not sample:
        sample = db.query(WaterSample).filter(WaterSample.sample_id == sample_id_or_code.upper()).first()

    if not sample:
        raise HTTPException(status_code=404, detail="Water sample not found")

    res = run_full_sample_analysis(sample.id, db, model_preference=req.model_preference or "ensemble")
    return format_analysis_response(res["analysis"])

@router.post("/batch", status_code=status.HTTP_200_OK)
def analyze_batch(
    req: BatchAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Runs batch analysis on a set of water samples or unanalyzed samples."""
    if req.sample_ids:
        samples = db.query(WaterSample).filter(WaterSample.id.in_(req.sample_ids)).all()
    else:
        samples = db.query(WaterSample).outerjoin(AnalysisResult).filter(AnalysisResult.id == None).all()

    processed = 0
    errors = []
    for s in samples:
        try:
            run_full_sample_analysis(s.id, db, model_preference=req.model_preference or "ensemble")
            processed += 1
        except Exception as e:
            errors.append(f"Sample {s.sample_id}: {str(e)}")

    return {
        "message": f"Batch analysis completed for {processed} samples.",
        "processed_count": processed,
        "errors": errors
    }

@router.get("/{sample_id_or_code}/result", response_model=AnalysisResultResponse)
def get_analysis_result(sample_id_or_code: str, db: Session = Depends(get_db)):
    """Retrieves the current active analysis result for a water sample."""
    sample = None
    if sample_id_or_code.isdigit():
        sample = db.query(WaterSample).filter(WaterSample.id == int(sample_id_or_code)).first()
    if not sample:
        sample = db.query(WaterSample).filter(WaterSample.sample_id == sample_id_or_code.upper()).first()

    if not sample or not sample.analysis:
        raise HTTPException(status_code=404, detail="Analysis result not found for this sample")

    return format_analysis_response(sample.analysis)

@router.get("/{sample_id_or_code}/history", response_model=AnalysisComparisonResponse)
def get_analysis_history(sample_id_or_code: str, db: Session = Depends(get_db)):
    """Retrieves all versioned historical analyses for a sample to compare changes over time."""
    sample = None
    if sample_id_or_code.isdigit():
        sample = db.query(WaterSample).filter(WaterSample.id == int(sample_id_or_code)).first()
    if not sample:
        sample = db.query(WaterSample).filter(WaterSample.sample_id == sample_id_or_code.upper()).first()

    if not sample:
        raise HTTPException(status_code=404, detail="Water sample not found")

    analyses = db.query(AnalysisResult).filter(
        AnalysisResult.sample_id == sample.id
    ).order_by(desc(AnalysisResult.created_at)).all()

    formatted = [format_analysis_response(a) for a in analyses]
    return {
        "sample_id": sample.sample_id,
        "total_analyses": len(analyses),
        "analyses": formatted
    }

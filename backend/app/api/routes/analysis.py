from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.water_sample import WaterSample
from app.models.analysis_result import AnalysisResult
from app.schemas.analysis import AnalysisResultResponse, SingleAnalysisRequest, BatchAnalysisRequest
from app.services.analysis_service import run_full_sample_analysis

router = APIRouter(prefix="/analysis", tags=["Water Quality Analysis"])

@router.post("/{sample_id_or_code}", response_model=AnalysisResultResponse)
def analyze_single_sample(
    sample_id_or_code: str,
    req: SingleAnalysisRequest = SingleAnalysisRequest(),
    db: Session = Depends(get_db)
):
    sample = None
    if sample_id_or_code.isdigit():
        sample = db.query(WaterSample).filter(WaterSample.id == int(sample_id_or_code)).first()
    if not sample:
        sample = db.query(WaterSample).filter(WaterSample.sample_id == sample_id_or_code.upper()).first()

    if not sample:
        raise HTTPException(status_code=404, detail="Water sample not found")

    res = run_full_sample_analysis(sample.id, db, model_preference=req.model_preference or "ensemble")
    
    # Return formatted response
    analysis = res["analysis"]
    class_res = res["classification"]
    return {
        "id": analysis.id,
        "sample_id": analysis.sample_id,
        "predicted_category": analysis.predicted_category,
        "confidence_score": analysis.confidence_score,
        "model_used": analysis.model_used,
        "wqi_score": analysis.wqi_score,
        "summary": analysis.summary,
        "observations": class_res.get("observations", []),
        "recommendations": class_res.get("recommendations", []),
        "probabilities": class_res.get("probabilities", {}),
        "created_at": analysis.created_at
    }

@router.post("/batch", status_code=status.HTTP_200_OK)
def analyze_batch(
    req: BatchAnalysisRequest,
    db: Session = Depends(get_db)
):
    if req.sample_ids:
        samples = db.query(WaterSample).filter(WaterSample.id.in_(req.sample_ids)).all()
    else:
        # Analyze all samples that lack an analysis result
        samples = db.query(WaterSample).outerjoin(AnalysisResult).filter(AnalysisResult.id == None).all()

    processed = 0
    for s in samples:
        try:
            run_full_sample_analysis(s.id, db)
            processed += 1
        except Exception:
            pass

    return {
        "message": f"Batch analysis completed for {processed} samples.",
        "processed_count": processed
    }

@router.get("/{sample_id_or_code}/result", response_model=AnalysisResultResponse)
def get_analysis_result(sample_id_or_code: str, db: Session = Depends(get_db)):
    sample = None
    if sample_id_or_code.isdigit():
        sample = db.query(WaterSample).filter(WaterSample.id == int(sample_id_or_code)).first()
    if not sample:
        sample = db.query(WaterSample).filter(WaterSample.sample_id == sample_id_or_code.upper()).first()

    if not sample or not sample.analysis:
        raise HTTPException(status_code=404, detail="Analysis result not found for this sample")

    import json
    a = sample.analysis
    obs = json.loads(a.observations_json) if a.observations_json else []
    recs = json.loads(a.recommendations_json) if a.recommendations_json else []
    probs = json.loads(a.probabilities_json) if a.probabilities_json else {}

    return {
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

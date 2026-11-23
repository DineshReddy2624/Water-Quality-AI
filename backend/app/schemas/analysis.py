from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ParameterObservation(BaseModel):
    parameter: str
    name: str
    value: float
    unit: str
    status: str  # "Normal", "Elevated", "Low", "Abnormal"
    optimal_range: str
    observation: str
    action_note: Optional[str] = None

class AnalysisResultResponse(BaseModel):
    id: int
    sample_id: int
    predicted_category: str  # Good Quality, Moderate Quality, Poor Quality, Potentially Contaminated
    confidence_score: Optional[float] = None
    model_used: str
    wqi_score: Optional[float] = None
    summary: Optional[str] = None
    observations: List[ParameterObservation] = []
    recommendations: List[Dict[str, Any]] = []
    probabilities: Optional[Dict[str, float]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SingleAnalysisRequest(BaseModel):
    model_preference: Optional[str] = "ensemble"  # ensemble, random_forest, xgboost, decision_tree

class BatchAnalysisRequest(BaseModel):
    sample_ids: Optional[List[int]] = None  # None means analyze all unanalyzed

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ParameterObservation(BaseModel):
    parameter: str
    name: str
    value: float
    unit: str
    status: str  # "Normal", "Elevated", "Low", "Critical High", "Critical Low"
    severity_level: Optional[str] = "Normal"
    optimal_range: str
    reference_source: Optional[str] = None
    observation: str
    action_note: Optional[str] = None

class AnalysisResultResponse(BaseModel):
    id: int
    sample_id: int
    analysis_version: int = 1
    is_current: bool = True
    predicted_category: str  # Good Quality, Moderate Quality, Poor Quality, Potentially Contaminated
    confidence_score: Optional[float] = None
    confidence_type: Optional[str] = "Calibrated ML Estimator Probability"
    model_used: str
    model_version: str = "v2.0"
    wqi_score: Optional[float] = None
    wqi_version: Optional[str] = "WA-WQI-v2.0-CPCB-Brown"
    is_anomaly: bool = False
    anomaly_score: Optional[float] = None
    raw_decision_score: Optional[float] = None
    anomaly_threshold: Optional[float] = 0.0
    severity: str = "Normal"
    summary: Optional[str] = None
    decision_explanation: Optional[str] = None
    decision_steps: List[str] = []
    observations: List[ParameterObservation] = []
    sub_indices: Optional[Dict[str, Any]] = None
    recommendations: List[Dict[str, Any]] = []
    probabilities: Optional[Dict[str, float]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SingleAnalysisRequest(BaseModel):
    model_preference: Optional[str] = "ensemble"  # ensemble, random_forest, xgboost, decision_tree, logistic_regression

class BatchAnalysisRequest(BaseModel):
    sample_ids: Optional[List[int]] = None  # None means analyze all unanalyzed
    model_preference: Optional[str] = "ensemble"

class AnalysisComparisonResponse(BaseModel):
    sample_id: str
    total_analyses: int
    analyses: List[AnalysisResultResponse]

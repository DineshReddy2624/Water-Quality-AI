from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AnomalyRecordResponse(BaseModel):
    id: int
    sample_id: int
    is_anomaly: bool
    anomaly_score: float
    severity: str  # Normal, Low, Medium, High
    detected_method: str
    abnormal_parameters: List[Dict[str, Any]] = []
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AnomalyDetectionRequest(BaseModel):
    sample_ids: Optional[List[int]] = None
    contamination_threshold: Optional[float] = 0.1

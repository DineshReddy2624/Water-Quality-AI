from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AlertResponse(BaseModel):
    id: int
    alert_id: str
    sample_id: int
    location_name: str
    abnormal_parameter: str
    measured_value: float
    threshold_value: str
    severity: str  # Low, Medium, High
    alert_message: str
    suggested_action: str
    status: str  # Active, Under Review, Resolved
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    status: str  # Active, Under Review, Resolved

class AlertCreate(BaseModel):
    sample_id: int
    location_name: str
    abnormal_parameter: str
    measured_value: float
    threshold_value: str
    severity: str = "Medium"
    alert_message: str
    suggested_action: str

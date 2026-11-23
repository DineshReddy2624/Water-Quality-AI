from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class WaterSourceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    location_name: str = Field(..., min_length=2, max_length=255)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    water_type: str = "lake"
    description: Optional[str] = None

class WaterSourceCreate(WaterSourceBase):
    pass

class WaterSourceUpdate(BaseModel):
    name: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    water_type: Optional[str] = None
    description: Optional[str] = None

class WaterSourceResponse(WaterSourceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    sample_count: int = 0
    abnormal_count: int = 0
    has_repeated_abnormal: bool = False

    class Config:
        from_attributes = True

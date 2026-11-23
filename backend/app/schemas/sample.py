from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class WaterParameterBase(BaseModel):
    ph: float = Field(..., ge=0.0, le=14.0, description="pH level (0-14)")
    turbidity: float = Field(..., ge=0.0, description="Turbidity in NTU")
    temperature: float = Field(..., ge=-5.0, le=60.0, description="Temperature in °C")
    dissolved_oxygen: float = Field(..., ge=0.0, description="Dissolved Oxygen in mg/L")
    tds: float = Field(..., ge=0.0, description="Total Dissolved Solids in mg/L")
    electrical_conductivity: float = Field(..., ge=0.0, description="Electrical Conductivity in µS/cm")
    
    # Optional parameters
    hardness: Optional[float] = Field(None, ge=0.0, description="Hardness in mg/L")
    chloramines: Optional[float] = Field(None, ge=0.0, description="Chloramines in mg/L")
    sulfate: Optional[float] = Field(None, ge=0.0, description="Sulfate in mg/L")
    organic_carbon: Optional[float] = Field(None, ge=0.0, description="Organic Carbon in mg/L")

class WaterParameterCreate(WaterParameterBase):
    pass

class WaterParameterResponse(WaterParameterBase):
    id: int
    sample_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class WaterSampleBase(BaseModel):
    water_source_name: str = Field(..., min_length=2, max_length=255)
    location_name: str = Field(..., min_length=2, max_length=255)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    collection_date: Optional[datetime] = None
    notes: Optional[str] = None

class WaterSampleCreate(WaterSampleBase):
    sample_id: Optional[str] = None  # Auto-generated if not provided
    parameters: WaterParameterCreate

class WaterSampleUpdate(BaseModel):
    water_source_name: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    collection_date: Optional[datetime] = None
    notes: Optional[str] = None
    parameters: Optional[WaterParameterCreate] = None

class WaterSampleResponse(WaterSampleBase):
    id: int
    sample_id: str
    water_source_id: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    parameters: Optional[WaterParameterResponse] = None

    class Config:
        from_attributes = True

class WaterSampleDetailResponse(WaterSampleResponse):
    analysis: Optional[Any] = None
    anomalies: List[Any] = []
    alerts: List[Any] = []
    recommendations: List[Any] = []

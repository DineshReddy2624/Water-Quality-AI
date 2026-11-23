from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

class WaterSource(Base):
    __tablename__ = "water_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    location_name = Column(String(255), index=True, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    water_type = Column(String(100), default="lake", nullable=False)  # lake, river, reservoir, groundwater, industrial, other
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    samples = relationship("WaterSample", back_populates="water_source")
    sensors = relationship("SensorDevice", back_populates="water_source")

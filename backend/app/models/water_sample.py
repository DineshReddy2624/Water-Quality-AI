from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

class WaterSample(Base):
    __tablename__ = "water_samples"

    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(String(100), unique=True, index=True, nullable=False)
    water_source_id = Column(Integer, ForeignKey("water_sources.id", ondelete="SET NULL"), nullable=True)
    water_source_name = Column(String(255), nullable=False)
    location_name = Column(String(255), index=True, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    collection_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    water_source = relationship("WaterSource", back_populates="samples")
    creator = relationship("User", back_populates="samples")
    parameters = relationship("WaterParameter", back_populates="sample", uselist=False, cascade="all, delete-orphan")
    analysis = relationship("AnalysisResult", back_populates="sample", uselist=False, cascade="all, delete-orphan")
    anomalies = relationship("AnomalyRecord", back_populates="sample", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="sample", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="sample", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="sample")

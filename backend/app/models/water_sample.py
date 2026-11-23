from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, and_
from sqlalchemy.orm import relationship, foreign
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
    timezone = Column(String(50), default="Asia/Kolkata", nullable=False)
    collection_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    water_source = relationship("WaterSource", back_populates="samples")
    creator = relationship("User", back_populates="samples")
    parameters = relationship("WaterParameter", back_populates="sample", uselist=False, cascade="all, delete-orphan")
    
    # Active current analysis
    analysis = relationship(
        "AnalysisResult",
        primaryjoin="and_(WaterSample.id==foreign(AnalysisResult.sample_id), foreign(AnalysisResult.is_current)==True)",
        uselist=False,
        viewonly=True
    )
    # Full historical analyses list
    analyses = relationship(
        "AnalysisResult",
        back_populates="sample",
        cascade="all, delete-orphan",
        order_by="desc(AnalysisResult.created_at)"
    )

    anomalies = relationship("AnomalyRecord", back_populates="sample", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="sample", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="sample", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="sample")

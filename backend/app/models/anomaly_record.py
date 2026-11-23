from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("water_samples.id", ondelete="CASCADE"), nullable=False)
    
    is_anomaly = Column(Boolean, default=False, nullable=False)
    anomaly_score = Column(Float, nullable=False)  # Raw score or normalized score
    severity = Column(String(50), default="Normal", nullable=False)  # Normal, Low, Medium, High
    detected_method = Column(String(100), default="Isolation Forest + Threshold Rules", nullable=False)
    abnormal_parameters_json = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sample = relationship("WaterSample", back_populates="anomalies")

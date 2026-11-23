from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    sample_id = Column(Integer, ForeignKey("water_samples.id", ondelete="CASCADE"), nullable=False)
    location_name = Column(String(255), index=True, nullable=False)
    abnormal_parameter = Column(String(100), nullable=False)
    measured_value = Column(Float, nullable=False)
    threshold_value = Column(String(100), nullable=False)
    severity = Column(String(50), default="Medium", nullable=False)  # Low, Medium, High
    alert_message = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    status = Column(String(50), default="Active", nullable=False)  # Active, Under Review, Resolved
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sample = relationship("WaterSample", back_populates="alerts")

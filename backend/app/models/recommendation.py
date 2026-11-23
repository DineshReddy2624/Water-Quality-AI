from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("water_samples.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), default="Monitoring", nullable=False)  # Sampling, Calibration, Investigation, Laboratory, Monitoring
    priority = Column(String(50), default="Medium", nullable=False)  # Low, Medium, High

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sample = relationship("WaterSample", back_populates="recommendations")

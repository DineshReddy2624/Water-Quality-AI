from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("water_samples.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # 4 categories: Good Quality, Moderate Quality, Poor Quality, Potentially Contaminated
    predicted_category = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=True)  # 0.0 - 1.0
    model_used = Column(String(100), default="Ensemble / Rules + Random Forest", nullable=False)
    wqi_score = Column(Float, nullable=True)  # Water Quality Index 0 - 100
    summary = Column(Text, nullable=True)
    
    # JSON strings or serialized observations
    observations_json = Column(Text, nullable=True)
    recommendations_json = Column(Text, nullable=True)
    probabilities_json = Column(Text, nullable=True)  # Probabilities per class

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sample = relationship("WaterSample", back_populates="analysis")

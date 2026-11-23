from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.base import Base

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("water_samples.id", ondelete="CASCADE"), index=True, nullable=False)
    
    # Versioning
    analysis_version = Column(Integer, default=1, nullable=False)
    is_current = Column(Boolean, default=True, index=True, nullable=False)

    # 4 categories: Good Quality, Moderate Quality, Poor Quality, Potentially Contaminated
    predicted_category = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=True)  # 0.0 - 1.0
    confidence_type = Column(String(100), default="Calibrated ML Estimator Probability", nullable=False)
    model_used = Column(String(150), default="Ensemble / Rules + Random Forest", nullable=False)
    model_version = Column(String(100), default="v1.0", nullable=False)
    
    # WQI
    wqi_score = Column(Float, nullable=True)  # Water Quality Index 0 - 100
    wqi_version = Column(String(100), default="WA-WQI-v2.0-CPCB-Brown", nullable=False)
    
    # Anomaly
    is_anomaly = Column(Boolean, default=False, nullable=False)
    anomaly_score = Column(Float, nullable=True)
    raw_decision_score = Column(Float, nullable=True)
    anomaly_threshold = Column(Float, default=0.0, nullable=False)
    severity = Column(String(50), default="Normal", nullable=False)

    summary = Column(Text, nullable=True)
    decision_explanation = Column(Text, nullable=True)
    decision_steps_json = Column(Text, nullable=True)
    classification_matrix_json = Column(Text, nullable=True)
    
    # JSON strings or serialized observations
    observations_json = Column(Text, nullable=True)
    sub_indices_json = Column(Text, nullable=True)
    recommendations_json = Column(Text, nullable=True)
    probabilities_json = Column(Text, nullable=True)  # Probabilities per class

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sample = relationship("WaterSample", back_populates="analyses")

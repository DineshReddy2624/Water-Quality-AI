from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class WaterParameter(Base):
    __tablename__ = "water_parameters"

    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("water_samples.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Core Parameters
    ph = Column(Float, nullable=False)
    turbidity = Column(Float, nullable=False)  # NTU
    temperature = Column(Float, nullable=False)  # °C
    dissolved_oxygen = Column(Float, nullable=False)  # mg/L
    tds = Column(Float, nullable=False)  # mg/L
    electrical_conductivity = Column(Float, nullable=False)  # µS/cm

    # Optional / Secondary Parameters
    hardness = Column(Float, nullable=True)  # mg/L
    chloramines = Column(Float, nullable=True)  # mg/L
    sulfate = Column(Float, nullable=True)  # mg/L
    organic_carbon = Column(Float, nullable=True)  # mg/L

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sample = relationship("WaterSample", back_populates="parameters")

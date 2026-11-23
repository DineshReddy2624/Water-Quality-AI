from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class SensorDevice(Base):
    __tablename__ = "sensor_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_code = Column(String(100), unique=True, index=True, nullable=False)
    device_name = Column(String(255), nullable=False)
    water_source_id = Column(Integer, ForeignKey("water_sources.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="online", nullable=False)  # online, offline, maintenance
    last_ping = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    water_source = relationship("WaterSource", back_populates="sensors")

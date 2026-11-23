from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.database.base import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(50), unique=True, index=True, nullable=False)
    report_type = Column(String(50), nullable=False)  # "sample_pdf", "summary_pdf", "samples_excel"
    title = Column(String(255), nullable=False)
    sample_id = Column(Integer, ForeignKey("water_samples.id", ondelete="SET NULL"), nullable=True)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, default=0, nullable=False)
    generated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sample = relationship("WaterSample", back_populates="reports")
    generator = relationship("User", back_populates="reports")

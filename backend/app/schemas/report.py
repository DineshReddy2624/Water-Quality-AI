from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ReportGenerateRequest(BaseModel):
    report_type: str  # "sample_pdf", "sample_excel", "summary_pdf", "samples_excel"
    sample_id: Optional[int] = None
    analysis_id: Optional[int] = None
    title: Optional[str] = None
    location_filter: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ReportResponse(BaseModel):
    id: int
    report_id: str
    report_type: str
    title: str
    sample_id: Optional[int] = None
    file_size_bytes: int
    download_url: str
    created_at: datetime

    class Config:
        from_attributes = True

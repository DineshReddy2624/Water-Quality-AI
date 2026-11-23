import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.core.dependencies import get_db, get_optional_user, get_current_user
from app.models.user import User
from app.models.water_sample import WaterSample
from app.models.analysis_result import AnalysisResult
from app.models.report import Report
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.reports.pdf_generator import generate_sample_pdf_report
from app.reports.excel_generator import generate_samples_excel_report, generate_single_sample_excel_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", response_model=ReportResponse)
def generate_report(
    req: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    report_uid = f"REP-{uuid.uuid4().hex[:8].upper()}"

    if req.report_type == "sample_pdf":
        if not req.sample_id:
            raise HTTPException(status_code=400, detail="sample_id required for sample_pdf report")
        sample = db.query(WaterSample).filter(WaterSample.id == req.sample_id).first()
        if not sample:
            raise HTTPException(status_code=404, detail="Water sample not found")

        analysis = None
        if req.analysis_id:
            analysis = db.query(AnalysisResult).filter(AnalysisResult.id == req.analysis_id, AnalysisResult.sample_id == sample.id).first()
        if not analysis:
            analysis = sample.analysis

        if not analysis:
            raise HTTPException(status_code=400, detail="No valid analysis run found for this sample.")

        file_name = f"water_sample_{sample.sample_id}_{timestamp_str}.pdf"
        file_path = os.path.join(settings.REPORT_DIR, file_name)
        generate_sample_pdf_report(sample, analysis, sample.anomalies, file_path)
        title = req.title or f"Water Quality Analysis Report - Sample {sample.sample_id}"

    elif req.report_type in ["sample_excel", "single_sample_excel"]:
        if not req.sample_id:
            raise HTTPException(status_code=400, detail="sample_id required for single case excel report")
        sample = db.query(WaterSample).filter(WaterSample.id == req.sample_id).first()
        if not sample:
            raise HTTPException(status_code=404, detail="Water sample not found")

        analysis = None
        if req.analysis_id:
            analysis = db.query(AnalysisResult).filter(AnalysisResult.id == req.analysis_id, AnalysisResult.sample_id == sample.id).first()
        if not analysis:
            analysis = sample.analysis

        if not analysis:
            raise HTTPException(status_code=400, detail="No valid analysis run found for this sample.")

        file_name = f"water_sample_{sample.sample_id}_{timestamp_str}.xlsx"
        file_path = os.path.join(settings.REPORT_DIR, file_name)
        generate_single_sample_excel_report(sample, analysis, file_path)
        title = req.title or f"Case Analytical Excel Report - Sample {sample.sample_id}"

    elif req.report_type in ["samples_excel", "dataset_excel"]:
        samples = db.query(WaterSample).all()
        file_name = f"water_quality_dataset_{timestamp_str}.xlsx"
        file_path = os.path.join(settings.REPORT_DIR, file_name)
        generate_samples_excel_report(samples, file_path)
        title = req.title or "Comprehensive Water Quality Dataset Export"

    elif req.report_type == "summary_pdf":
        samples = db.query(WaterSample).all()
        # Fallback to excel export or single sample pdf
        sample = samples[0] if samples else None
        if not sample:
            raise HTTPException(status_code=400, detail="No water samples found to summarize")
        file_name = f"water_monitoring_summary_{timestamp_str}.pdf"
        file_path = os.path.join(settings.REPORT_DIR, file_name)
        generate_sample_pdf_report(sample, sample.analysis, sample.anomalies, file_path)
        title = req.title or "Water Quality Monitoring Executive Summary"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported report type: {req.report_type}")

    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    report = Report(
        report_id=report_uid,
        report_type=req.report_type,
        title=title,
        sample_id=req.sample_id,
        file_path=file_path,
        file_size_bytes=file_size,
        generated_by_id=current_user.id if current_user else None
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "report_id": report.report_id,
        "report_type": report.report_type,
        "title": report.title,
        "sample_id": report.sample_id,
        "file_size_bytes": report.file_size_bytes,
        "download_url": f"/api/reports/{report.report_id}/download",
        "created_at": report.created_at
    }

@router.get("/", response_model=List[ReportResponse])
def list_reports(limit: int = 50, db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(desc(Report.created_at)).limit(limit).all()
    return [
        {
            "id": r.id,
            "report_id": r.report_id,
            "report_type": r.report_type,
            "title": r.title,
            "sample_id": r.sample_id,
            "file_size_bytes": r.file_size_bytes,
            "download_url": f"/api/reports/{r.report_id}/download",
            "created_at": r.created_at
        }
        for r in reports
    ]

@router.get("/{report_id_or_code}/download")
def download_report(report_id_or_code: str, db: Session = Depends(get_db)):
    report = None
    if report_id_or_code.isdigit():
        report = db.query(Report).filter(Report.id == int(report_id_or_code)).first()
    if not report:
        report = db.query(Report).filter(Report.report_id == report_id_or_code).first()

    if not report or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    filename = os.path.basename(report.file_path)
    media_type = "application/pdf" if report.file_path.endswith(".pdf") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    return FileResponse(
        path=report.file_path,
        filename=filename,
        media_type=media_type
    )

@router.get("/sample/{sample_id}/pdf")
def direct_sample_pdf(
    sample_id: int,
    analysis_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    sample = db.query(WaterSample).filter(WaterSample.id == sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    analysis = None
    if analysis_id:
        analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id, AnalysisResult.sample_id == sample.id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Selected analysis run not found for this sample")
    else:
        analysis = sample.analysis

    if not analysis:
        raise HTTPException(status_code=400, detail="No valid analysis run available for this sample")

    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_name = f"water_sample_{sample.sample_id}_run{analysis.id}_{timestamp_str}.pdf"
    file_path = os.path.join(settings.REPORT_DIR, file_name)
    generate_sample_pdf_report(sample, analysis, sample.anomalies, file_path)

    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="application/pdf"
    )

@router.get("/sample/{sample_id}/excel")
def direct_sample_excel(
    sample_id: int,
    analysis_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    sample = db.query(WaterSample).filter(WaterSample.id == sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    analysis = None
    if analysis_id:
        analysis = db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id, AnalysisResult.sample_id == sample.id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Selected analysis run not found for this sample")
    else:
        analysis = sample.analysis

    if not analysis:
        raise HTTPException(status_code=400, detail="No valid analysis run available for this sample")

    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_name = f"water_sample_{sample.sample_id}_run{analysis.id}_{timestamp_str}.xlsx"
    file_path = os.path.join(settings.REPORT_DIR, file_name)
    generate_single_sample_excel_report(sample, analysis, file_path)

    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.get("/export/excel")
def direct_dataset_excel(db: Session = Depends(get_db)):
    samples = db.query(WaterSample).all()
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_name = f"water_quality_dataset_{timestamp_str}.xlsx"
    file_path = os.path.join(settings.REPORT_DIR, file_name)
    generate_samples_excel_report(samples, file_path)

    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

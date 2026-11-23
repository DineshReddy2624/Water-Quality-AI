import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.dependencies import get_db
from app.models.anomaly_record import AnomalyRecord
from app.models.water_sample import WaterSample
from app.schemas.anomaly import AnomalyRecordResponse

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

@router.get("/", response_model=List[dict])
def list_anomalies(
    only_anomalies: bool = Query(True, description="Filter only confirmed anomalies"),
    severity: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(AnomalyRecord).join(WaterSample)
    if only_anomalies:
        query = query.filter(AnomalyRecord.is_anomaly == True)
    if severity and severity.strip():
        query = query.filter(AnomalyRecord.severity.ilike(severity.strip()))

    records = query.order_by(desc(AnomalyRecord.created_at)).limit(limit).all()

    result = []
    for r in records:
        abn = []
        try:
            if r.abnormal_parameters_json:
                abn = json.loads(r.abnormal_parameters_json)
        except Exception:
            pass
        result.append({
            "id": r.id,
            "sample_id": r.sample_id,
            "sample_code": r.sample.sample_id if r.sample else f"ID-{r.sample_id}",
            "location_name": r.sample.location_name if r.sample else "Unknown",
            "is_anomaly": r.is_anomaly,
            "anomaly_score": r.anomaly_score,
            "severity": r.severity,
            "detected_method": r.detected_method,
            "abnormal_parameters": abn,
            "notes": r.notes,
            "created_at": r.created_at
        })
    return result

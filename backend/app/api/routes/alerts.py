from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertStatusUpdate

router = APIRouter(prefix="/alerts", tags=["Alerts Management"])

@router.get("/", response_model=List[AlertResponse])
def list_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status and status.strip():
        query = query.filter(Alert.status.ilike(status.strip()))
    if severity and severity.strip():
        query = query.filter(Alert.severity.ilike(severity.strip()))
    if location and location.strip():
        query = query.filter(Alert.location_name.ilike(f"%{location.strip()}%"))

    return query.order_by(desc(Alert.created_at)).limit(limit).all()

@router.put("/{alert_id}/status", response_model=AlertResponse)
def update_alert_status(
    alert_id: str,
    status_in: AlertStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = None
    if alert_id.isdigit():
        alert = db.query(Alert).filter(Alert.id == int(alert_id)).first()
    if not alert:
        alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if status_in.status not in ["Active", "Under Review", "Resolved"]:
        raise HTTPException(status_code=400, detail="Status must be 'Active', 'Under Review', or 'Resolved'")

    alert.status = status_in.status
    alert.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.water_source import WaterSource
from app.models.water_sample import WaterSample
from app.models.anomaly_record import AnomalyRecord
from app.schemas.location import WaterSourceCreate, WaterSourceUpdate, WaterSourceResponse

router = APIRouter(prefix="/locations", tags=["Water Source Locations"])

@router.get("/", response_model=List[WaterSourceResponse])
def list_locations(db: Session = Depends(get_db)):
    sources = db.query(WaterSource).all()
    results = []
    for s in sources:
        sample_count = db.query(WaterSample).filter(WaterSample.water_source_id == s.id).count()
        abnormal_count = db.query(AnomalyRecord).join(WaterSample).filter(
            WaterSample.water_source_id == s.id,
            AnomalyRecord.is_anomaly == True
        ).count()

        results.append({
            "id": s.id,
            "name": s.name,
            "location_name": s.location_name,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "water_type": s.water_type,
            "description": s.description,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "sample_count": sample_count,
            "abnormal_count": abnormal_count,
            "has_repeated_abnormal": abnormal_count >= 2
        })
    return results

@router.post("/", response_model=WaterSourceResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    loc_in: WaterSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(WaterSource).filter(WaterSource.name == loc_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Water source with this name already exists")
    
    source = WaterSource(
        name=loc_in.name,
        location_name=loc_in.location_name,
        latitude=loc_in.latitude,
        longitude=loc_in.longitude,
        water_type=loc_in.water_type or "lake",
        description=loc_in.description
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return {
        "id": source.id,
        "name": source.name,
        "location_name": source.location_name,
        "latitude": source.latitude,
        "longitude": source.longitude,
        "water_type": source.water_type,
        "description": source.description,
        "created_at": source.created_at,
        "updated_at": source.updated_at,
        "sample_count": 0,
        "abnormal_count": 0,
        "has_repeated_abnormal": False
    }

@router.get("/{location_id}", response_model=WaterSourceResponse)
def get_location(location_id: int, db: Session = Depends(get_db)):
    s = db.query(WaterSource).filter(WaterSource.id == location_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Location not found")
    sample_count = db.query(WaterSample).filter(WaterSample.water_source_id == s.id).count()
    abnormal_count = db.query(AnomalyRecord).join(WaterSample).filter(
        WaterSample.water_source_id == s.id,
        AnomalyRecord.is_anomaly == True
    ).count()
    return {
        "id": s.id,
        "name": s.name,
        "location_name": s.location_name,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "water_type": s.water_type,
        "description": s.description,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "sample_count": sample_count,
        "abnormal_count": abnormal_count,
        "has_repeated_abnormal": abnormal_count >= 2
    }

@router.put("/{location_id}", response_model=WaterSourceResponse)
def update_location(
    location_id: int,
    loc_in: WaterSourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(WaterSource).filter(WaterSource.id == location_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Location not found")
    if loc_in.name:
        s.name = loc_in.name
    if loc_in.location_name:
        s.location_name = loc_in.location_name
    if loc_in.latitude is not None:
        s.latitude = loc_in.latitude
    if loc_in.longitude is not None:
        s.longitude = loc_in.longitude
    if loc_in.water_type:
        s.water_type = loc_in.water_type
    if loc_in.description is not None:
        s.description = loc_in.description

    db.commit()
    db.refresh(s)
    sample_count = db.query(WaterSample).filter(WaterSample.water_source_id == s.id).count()
    abnormal_count = db.query(AnomalyRecord).join(WaterSample).filter(
        WaterSample.water_source_id == s.id,
        AnomalyRecord.is_anomaly == True
    ).count()
    return {
        "id": s.id,
        "name": s.name,
        "location_name": s.location_name,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "water_type": s.water_type,
        "description": s.description,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "sample_count": sample_count,
        "abnormal_count": abnormal_count,
        "has_repeated_abnormal": abnormal_count >= 2
    }

@router.delete("/{location_id}")
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(WaterSource).filter(WaterSource.id == location_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(s)
    db.commit()
    return {"message": "Location deleted successfully"}

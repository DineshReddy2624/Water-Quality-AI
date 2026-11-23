from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_db, get_optional_user
from app.models.water_sample import WaterSample
from app.models.water_source import WaterSource
from app.models.water_parameter import WaterParameter
from app.models.analysis_result import AnalysisResult
from app.models.anomaly_record import AnomalyRecord
from app.models.alert import Alert

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_samples = db.query(WaterSample).count()
    total_locations = db.query(WaterSource).count()
    
    # Category counts
    category_counts = {
        "Good Quality": db.query(AnalysisResult).filter(AnalysisResult.predicted_category == "Good Quality").count(),
        "Moderate Quality": db.query(AnalysisResult).filter(AnalysisResult.predicted_category == "Moderate Quality").count(),
        "Poor Quality": db.query(AnalysisResult).filter(AnalysisResult.predicted_category == "Poor Quality").count(),
        "Potentially Contaminated": db.query(AnalysisResult).filter(AnalysisResult.predicted_category == "Potentially Contaminated").count(),
    }
    
    total_anomalies = db.query(AnomalyRecord).filter(AnomalyRecord.is_anomaly == True).count()
    active_alerts = db.query(Alert).filter(Alert.status == "Active").count()
    under_review_alerts = db.query(Alert).filter(Alert.status == "Under Review").count()
    resolved_alerts = db.query(Alert).filter(Alert.status == "Resolved").count()

    # Average metrics
    avg_params = db.query(
        func.avg(WaterParameter.ph).label("avg_ph"),
        func.avg(WaterParameter.turbidity).label("avg_turbidity"),
        func.avg(WaterParameter.dissolved_oxygen).label("avg_do"),
        func.avg(WaterParameter.tds).label("avg_tds"),
        func.avg(WaterParameter.electrical_conductivity).label("avg_ec"),
        func.avg(WaterParameter.temperature).label("avg_temp")
    ).first()

    return {
        "kpis": {
            "total_samples": total_samples,
            "total_locations": total_locations,
            "good_quality_count": category_counts["Good Quality"],
            "moderate_quality_count": category_counts["Moderate Quality"],
            "poor_quality_count": category_counts["Poor Quality"],
            "potentially_contaminated_count": category_counts["Potentially Contaminated"],
            "total_anomalies": total_anomalies,
            "active_alerts": active_alerts,
            "under_review_alerts": under_review_alerts,
            "resolved_alerts": resolved_alerts
        },
        "averages": {
            "ph": round(float(avg_params.avg_ph or 7.2), 2),
            "turbidity": round(float(avg_params.avg_turbidity or 3.5), 2),
            "dissolved_oxygen": round(float(avg_params.avg_do or 6.5), 2),
            "tds": round(float(avg_params.avg_tds or 420.0), 1),
            "electrical_conductivity": round(float(avg_params.avg_ec or 620.0), 1),
            "temperature": round(float(avg_params.avg_temp or 24.0), 1)
        }
    }

@router.get("/trends")
def get_dashboard_trends(db: Session = Depends(get_db)):
    samples = db.query(WaterSample).order_by(WaterSample.collection_date.asc()).limit(30).all()
    trend_data = []
    for s in samples:
        p = s.parameters
        a = s.analysis
        if p:
            trend_data.append({
                "sample_id": s.sample_id,
                "date": s.collection_date.strftime("%Y-%m-%d %H:%M") if s.collection_date else "N/A",
                "location": s.location_name,
                "ph": round(p.ph, 2),
                "turbidity": round(p.turbidity, 2),
                "dissolved_oxygen": round(p.dissolved_oxygen, 2),
                "tds": round(p.tds, 1),
                "electrical_conductivity": round(p.electrical_conductivity, 1),
                "temperature": round(p.temperature, 1),
                "wqi": a.wqi_score if a and a.wqi_score else None,
                "category": a.predicted_category if a else "Pending"
            })
    return {"trends": trend_data}

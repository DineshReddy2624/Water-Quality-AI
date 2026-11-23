import json
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.water_sample import WaterSample
from app.models.water_parameter import WaterParameter
from app.models.analysis_result import AnalysisResult
from app.models.anomaly_record import AnomalyRecord
from app.models.alert import Alert
from app.models.recommendation import Recommendation
from app.ml.prediction import predict_water_quality
from app.ml.anomaly_detection import detect_anomalies

def run_full_sample_analysis(sample_id: int, db: Session, model_preference: str = "ensemble") -> Dict[str, Any]:
    """
    Executes full analytical workflow for a given water sample:
    1. Extracts parameter dictionary
    2. Runs ML & rule-based classification
    3. Runs Isolation Forest and threshold-based anomaly detection
    4. Persists AnalysisResult, AnomalyRecord, Alerts, and Recommendations
    """
    sample = db.query(WaterSample).filter(WaterSample.id == sample_id).first()
    if not sample or not sample.parameters:
        raise ValueError(f"Sample {sample_id} or its parameters not found")

    p = sample.parameters
    param_dict = {
        "ph": p.ph,
        "turbidity": p.turbidity,
        "temperature": p.temperature,
        "dissolved_oxygen": p.dissolved_oxygen,
        "tds": p.tds,
        "electrical_conductivity": p.electrical_conductivity,
        "hardness": p.hardness,
        "chloramines": p.chloramines,
        "sulfate": p.sulfate,
        "organic_carbon": p.organic_carbon,
        "location_name": sample.location_name
    }

    # 1. Classification
    class_res = predict_water_quality(param_dict, model_preference=model_preference)

    # 2. Anomaly Detection
    anom_res = detect_anomalies(param_dict)

    # 3. Update or create AnalysisResult
    existing_analysis = db.query(AnalysisResult).filter(AnalysisResult.sample_id == sample.id).first()
    if not existing_analysis:
        existing_analysis = AnalysisResult(sample_id=sample.id)
        db.add(existing_analysis)

    existing_analysis.predicted_category = class_res["predicted_category"]
    existing_analysis.confidence_score = class_res.get("confidence_score", 0.90)
    existing_analysis.model_used = class_res.get("model_used", "Ensemble")
    existing_analysis.wqi_score = class_res.get("wqi_score")
    existing_analysis.summary = class_res.get("summary")
    existing_analysis.observations_json = json.dumps(class_res.get("observations", []))
    existing_analysis.recommendations_json = json.dumps(class_res.get("recommendations", []))
    existing_analysis.probabilities_json = json.dumps(class_res.get("probabilities", {}))
    existing_analysis.created_at = datetime.utcnow()

    # 4. Update or create AnomalyRecord
    existing_anom = db.query(AnomalyRecord).filter(AnomalyRecord.sample_id == sample.id).first()
    if not existing_anom:
        existing_anom = AnomalyRecord(sample_id=sample.id)
        db.add(existing_anom)

    existing_anom.is_anomaly = anom_res["is_anomaly"]
    existing_anom.anomaly_score = anom_res["anomaly_score"]
    existing_anom.severity = anom_res["severity"]
    existing_anom.detected_method = anom_res["detected_method"]
    existing_anom.abnormal_parameters_json = json.dumps(anom_res.get("abnormal_parameters", []))
    existing_anom.notes = anom_res.get("notes")
    existing_anom.created_at = datetime.utcnow()

    # 5. Generate Alerts for abnormal parameters
    # Clear existing active alerts for this sample to avoid duplicates on re-analysis
    db.query(Alert).filter(Alert.sample_id == sample.id, Alert.status == "Active").delete()

    for obs in class_res.get("observations", []):
        if obs["status"] != "Normal":
            alert_code = f"ALT-{sample.sample_id}-{obs['parameter'][:3].upper()}"
            sev = "High" if "Critical" in obs["status"] else ("Medium" if obs["status"] in ["Elevated", "Low"] else "Low")
            alert = Alert(
                alert_id=alert_code,
                sample_id=sample.id,
                location_name=sample.location_name,
                abnormal_parameter=obs["name"],
                measured_value=obs["value"],
                threshold_value=obs["optimal_range"],
                severity=sev,
                alert_message=f"{obs['name']} measured at {obs['value']} {obs['unit']} ({obs['observation']})",
                suggested_action=obs.get("action_note") or "Verify calibration and collect duplicate confirmatory sample.",
                status="Active"
            )
            db.add(alert)

    # 6. Update Recommendations
    db.query(Recommendation).filter(Recommendation.sample_id == sample.id).delete()
    for rec in class_res.get("recommendations", []):
        r = Recommendation(
            sample_id=sample.id,
            title=rec.get("title", "Quality Advisory"),
            description=rec.get("description", ""),
            category=rec.get("category", "Monitoring"),
            priority=rec.get("priority", "Medium")
        )
        db.add(r)

    db.commit()
    db.refresh(existing_analysis)

    return {
        "analysis": existing_analysis,
        "anomaly": existing_anom,
        "classification": class_res,
        "anomaly_details": anom_res
    }

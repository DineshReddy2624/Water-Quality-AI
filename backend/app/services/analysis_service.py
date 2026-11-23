"""
Full Water Quality Sample Analysis Workflow Service.

Executes:
1. Feature extraction and parameter evaluation.
2. Weighted Arithmetic WQI computation (Brown et al. / CPCB).
3. Hybrid classification with safety arbitration.
4. Multivariate Isolation Forest anomaly detection.
5. Parameter-specific recommendation generation.
6. Versioned persistence in PostgreSQL / SQLite.
"""

import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.water_sample import WaterSample
from app.models.water_parameter import WaterParameter
from app.models.analysis_result import AnalysisResult
from app.models.anomaly_record import AnomalyRecord
from app.models.alert import Alert
from app.models.recommendation import Recommendation
from app.ml.prediction import predict_water_quality
from app.ml.anomaly_detection import detect_anomalies
from app.ml.wqi_calculator import WQI_CALCULATION_VERSION

def run_full_sample_analysis(sample_id: int, db: Session, model_preference: str = "ensemble") -> Dict[str, Any]:
    """
    Executes full analytical workflow for a given water sample and persists
    versioned analysis records, anomaly scoring, alerts, and recommendations.
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

    # 1. Classification & WA-WQI
    class_res = predict_water_quality(param_dict, model_preference=model_preference)

    # 2. Multivariate Isolation Forest Anomaly Detection
    anom_res = detect_anomalies(param_dict)

    # 3. Versioned AnalysisResult Persistence
    # Mark prior analyses for this sample as is_current = False
    prior_analyses = db.query(AnalysisResult).filter(AnalysisResult.sample_id == sample.id).all()
    version = 1
    if prior_analyses:
        version = max(a.analysis_version for a in prior_analyses) + 1
        for a in prior_analyses:
            a.is_current = False

    wqi_dict = class_res.get("wqi_details", {})
    sub_indices_json = json.dumps(wqi_dict.get("sub_indices", {}))
    decision_steps_json = json.dumps(class_res.get("decision_steps", []))
    matrix_json = json.dumps(class_res.get("classification_matrix_4tier", {}))

    new_analysis = AnalysisResult(
        sample_id=sample.id,
        analysis_version=version,
        is_current=True,
        predicted_category=class_res["predicted_category"],
        confidence_score=class_res.get("confidence_score", 0.90),
        confidence_type=class_res.get("confidence_type", "Calibrated ML Estimator Probability"),
        model_used=class_res.get("model_used", "Ensemble"),
        model_version="v2.0",
        wqi_score=class_res.get("wqi_score"),
        wqi_version=WQI_CALCULATION_VERSION,
        is_anomaly=anom_res["is_anomaly"],
        anomaly_score=anom_res["anomaly_score"],
        raw_decision_score=anom_res["raw_decision_score"],
        anomaly_threshold=anom_res["anomaly_threshold"],
        severity=anom_res["severity"],
        summary=class_res.get("summary"),
        decision_explanation=class_res.get("decision_explanation"),
        decision_steps_json=decision_steps_json,
        classification_matrix_json=matrix_json,
        observations_json=json.dumps(class_res.get("observations", [])),
        sub_indices_json=sub_indices_json,
        recommendations_json=json.dumps(class_res.get("recommendations", [])),
        probabilities_json=json.dumps(class_res.get("probabilities", {})),
        created_at=datetime.utcnow()
    )
    db.add(new_analysis)

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

    # 5. Alerts Generation
    # Clear existing active alerts for this sample before regenerating
    db.query(Alert).filter(Alert.sample_id == sample.id, Alert.status == "Active").delete()

    for obs in class_res.get("observations", []):
        if obs["status"] != "Normal":
            alert_code = f"ALT-{sample.sample_id}-{obs['parameter'][:3].upper()}"
            alert_sev = "High" if "Critical" in obs["status"] else ("Medium" if obs["status"] in ["Elevated", "Low"] else "Low")
            alert = Alert(
                alert_id=alert_code,
                sample_id=sample.id,
                location_name=sample.location_name,
                abnormal_parameter=obs["name"],
                measured_value=obs["value"],
                threshold_value=obs["optimal_range"],
                severity=alert_sev,
                alert_message=f"{obs['name']} measured at {obs['value']} {obs['unit']} ({obs['observation']})",
                suggested_action=obs.get("action_note") or "Verify sensor calibration and collect duplicate confirmatory sample.",
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
    db.refresh(new_analysis)

    return {
        "analysis": new_analysis,
        "anomaly": existing_anom,
        "classification": class_res,
        "anomaly_details": anom_res
    }

import os
import joblib
import numpy as np
from typing import Dict, Any, List, Tuple
from app.core.config import settings
from app.ml.preprocessing import prepare_feature_vector, FEATURE_COLUMNS
from app.ml.classification import evaluate_parameters

ISOLATION_FOREST_MODEL_FILE = os.path.join(settings.MODEL_DIR, "isolation_forest.joblib")

def detect_anomalies(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Detects water sample anomalies using a hybrid approach:
    1. Isolation Forest ML model (statistical multidimensional outlier scoring)
    2. Multi-parameter threshold rules
    """
    observations, severe_violations, abnormal_params = evaluate_parameters(params)
    abnormal_count = len(abnormal_params)

    # 1. Isolation Forest score
    ifos_model = None
    if os.path.exists(ISOLATION_FOREST_MODEL_FILE):
        try:
            ifos_model = joblib.load(ISOLATION_FOREST_MODEL_FILE)
        except Exception:
            ifos_model = None

    vec = prepare_feature_vector(params)
    
    if ifos_model is not None:
        try:
            raw_pred = ifos_model.predict(vec)[0]  # -1 for anomaly, 1 for normal
            decision_function_score = float(ifos_model.decision_function(vec)[0])
            # Normalize decision score roughly between 0.0 (high anomaly) and 1.0 (normal)
            norm_anomaly_score = round(float(1.0 / (1.0 + np.exp(decision_function_score * 5))), 4)
            ml_anomaly_detected = (raw_pred == -1)
            method = "Isolation Forest (Ensemble Outlier)"
        except Exception:
            decision_function_score = 0.0
            norm_anomaly_score = 0.5
            ml_anomaly_detected = False
            method = "Threshold Rules Fallback"
    else:
        # Fallback heuristic anomaly score based on deviation count
        norm_anomaly_score = min(1.0, round((abnormal_count * 0.25) + (severe_violations * 0.35), 4))
        ml_anomaly_detected = norm_anomaly_score >= 0.5
        method = "Configurable Parameter Thresholds"

    # Hybrid decision
    is_anomaly = bool(ml_anomaly_detected or (severe_violations >= 1) or (abnormal_count >= 2))
    
    # Severity assignment
    if severe_violations >= 2 or abnormal_count >= 4 or norm_anomaly_score > 0.75:
        severity = "High"
    elif severe_violations == 1 or abnormal_count >= 2 or norm_anomaly_score > 0.5:
        severity = "Medium"
    elif abnormal_count == 1 or is_anomaly:
        severity = "Low"
    else:
        severity = "Normal"

    # Build abnormal parameters detail
    abnormal_details = [obs for obs in observations if obs["status"] != "Normal"]

    notes = []
    if is_anomaly:
        notes.append(f"Detected {abnormal_count} abnormal parameter(s) with {severe_violations} critical violation(s).")
        notes.append(f"Severity classified as {severity}.")
    else:
        notes.append("No statistical or threshold-based anomalies detected; measurements lie within expected envelope.")

    return {
        "is_anomaly": is_anomaly,
        "anomaly_score": norm_anomaly_score,
        "severity": severity,
        "detected_method": method,
        "abnormal_parameters": abnormal_details,
        "abnormal_parameter_names": abnormal_params,
        "severe_violations": severe_violations,
        "notes": " ".join(notes)
    }

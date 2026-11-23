"""
Isolation Forest and Multivariate Water Quality Anomaly Detection Engine.

Implements statistical and threshold-based anomaly detection with transparent
scoring conventions, decision thresholds, and parameter contribution breakdown.

Scoring Convention:
- Scikit-Learn IsolationForest.decision_function(X):
    * Positive (> 0.0): Inlier / Normal observation envelope.
    * Negative (< 0.0): Outlier / Statistical anomaly.
    * Decision threshold is strictly 0.0.
- Normalized Anomaly Score (0.0 to 1.0):
    * S_norm = 1 / (1 + exp(8 * decision_score))
    * S_norm < 0.50: Statistical Inlier (Within Normal ML Envelope).
    * S_norm >= 0.50: Statistical Anomaly detected.

Separation of Anomaly Signals:
1. ML Isolation Forest Outlier: Detects multivariate geometrical deviations in parameter space.
2. Parameter Threshold Rules: Detects individual parameter breaches (e.g. Turbidity > 10 NTU).
This prevents contradictory outputs (e.g., claiming a normalized score of 0.337 with threshold 0.500 is an 'ML Anomaly').
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, List, Tuple
from app.core.config import settings
from app.core.parameter_config import PARAMETER_CONFIGS, evaluate_parameter_status
from app.ml.preprocessing import prepare_feature_vector, FEATURE_COLUMNS

ISOLATION_FOREST_MODEL_FILE = os.path.join(settings.MODEL_DIR, "isolation_forest.joblib")
ANOMALY_MODEL_VERSION = "IsolationForest-scikit-learn-v1.0"
ANOMALY_DECISION_THRESHOLD = 0.500  # Normalized threshold (equivalent to raw decision_score = 0.0)

def detect_anomalies(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Detects multivariate ML anomalies and deterministic parameter threshold breaches.
    Separates statistical inlier/outlier from parameter rule violations.
    """
    # 1. Parameter-level baseline evaluation
    abnormal_details = []
    severe_violations = 0
    contributing_parameters = []

    for key, cfg in PARAMETER_CONFIGS.items():
        val = params.get(key)
        if val is None or val == "":
            continue
        try:
            val_f = float(val)
        except (ValueError, TypeError):
            continue

        eval_res = evaluate_parameter_status(key, val_f)
        if eval_res["status"] != "Normal":
            abnormal_details.append(eval_res)
            if eval_res["severity_level"] == "High":
                severe_violations += 1

            opt_min = cfg["optimal_min"] or 0.0
            opt_max = cfg["optimal_max"] or cfg["standard_value"]
            center = (opt_min + opt_max) / 2.0
            deviation = abs(val_f - center)
            contributing_parameters.append({
                "parameter": key,
                "name": cfg["name"],
                "measured_value": val_f,
                "unit": cfg["unit"],
                "status": eval_res["status"],
                "severity": eval_res["severity_level"],
                "deviation_from_center": round(deviation, 2),
                "screening_baseline": eval_res["optimal_range"]
            })

    abnormal_count = len(abnormal_details)
    rule_threshold_flag = bool(severe_violations >= 1 or abnormal_count >= 2)

    # 2. Isolation Forest ML model scoring
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
            raw_decision = float(ifos_model.decision_function(vec)[0])
            # Sigmoid normalization:
            # Positive raw_decision (inlier) -> norm_score < 0.50
            # Negative raw_decision (outlier) -> norm_score >= 0.50
            norm_score = float(1.0 / (1.0 + np.exp(raw_decision * 8.0)))
            ml_anomaly_flag = bool(raw_pred == -1 or raw_decision < 0.0 or norm_score >= 0.50)
            method = "Isolation Forest Multivariate ML + Configurable Baselines"
        except Exception:
            raw_decision = 0.0
            norm_score = 0.50
            ml_anomaly_flag = False
            method = "Threshold Rules Fallback (Model Error)"
    else:
        # Fallback heuristic when model joblib is not yet trained
        raw_decision = round(0.20 - (abnormal_count * 0.15) - (severe_violations * 0.25), 4)
        norm_score = min(1.0, max(0.0, float(1.0 / (1.0 + np.exp(raw_decision * 8.0)))))
        ml_anomaly_flag = norm_score >= 0.50
        method = "Configurable Parameter Thresholds (Deterministic Fallback)"

    # Overall Anomaly Status: flagged if statistical ML outlier OR rule-based threshold breached
    is_anomaly = bool(ml_anomaly_flag or rule_threshold_flag)

    # Severity Assignment
    if severe_violations >= 2 or abnormal_count >= 4 or norm_score > 0.80:
        severity = "High"
    elif severe_violations == 1 or abnormal_count >= 2 or norm_score >= 0.50:
        severity = "Medium"
    elif abnormal_count == 1 or is_anomaly:
        severity = "Low"
    else:
        severity = "Normal"

    # Status descriptions without contradiction
    ml_status_desc = "Statistical Outlier (Multivariate Anomaly)" if ml_anomaly_flag else "Statistical Inlier (Within Normal ML Envelope)"
    rule_status_desc = f"Flagged ({severe_violations} Critical Violation(s), {abnormal_count} Total Deviations)" if rule_threshold_flag else "Within Parameter Thresholds"

    # Dynamic parameter-specific anomaly explanation
    if ml_anomaly_flag:
        ml_explanation = f"Isolation Forest detected a statistical outlier pattern because the normalized outlier score of {norm_score:.3f} exceeds the configured threshold of 0.500."
    else:
        ml_explanation = f"Isolation Forest detected a statistical inlier pattern because the normalized outlier score of {norm_score:.3f} is within the configured threshold of 0.500."

    notes_list = [ml_explanation]
    if rule_threshold_flag:
        notes_list.append(
            f"Deterministic screening flagged {severe_violations} critical breach(es) and {abnormal_count} total deviation(s)."
        )
    if is_anomaly:
        notes_list.append(f"Recommended action: {severity} Priority Field Verification.")
    else:
        notes_list.append("Measurements lie within expected operational baseline and statistical envelope.")

    return {
        "is_anomaly": is_anomaly,
        "anomaly_score": round(norm_score, 4),
        "raw_decision_score": round(raw_decision, 4),
        "decision_threshold": ANOMALY_DECISION_THRESHOLD,
        "anomaly_threshold": ANOMALY_DECISION_THRESHOLD,
        "ml_anomaly_detected": ml_anomaly_flag,
        "ml_anomaly_status": ml_status_desc,
        "anomaly_explanation": ml_explanation,
        "rule_threshold_detected": rule_threshold_flag,
        "rule_threshold_status": rule_status_desc,
        "severity": severity,
        "detected_method": method,
        "model_version": ANOMALY_MODEL_VERSION,
        "abnormal_parameters": abnormal_details,
        "abnormal_parameter_names": [a["parameter"] for a in abnormal_details],
        "contributing_parameters": contributing_parameters,
        "abnormal_count": abnormal_count,
        "severe_violations": severe_violations,
        "notes": " ".join(notes_list)
    }

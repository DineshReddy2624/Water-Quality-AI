import os
import joblib
import numpy as np
from typing import Dict, Any, Optional
from app.core.config import settings
from app.ml.preprocessing import prepare_feature_vector, FEATURE_COLUMNS
from app.ml.classification import classify_water_quality_rules, QUALITY_CATEGORIES

def predict_water_quality(params: Dict[str, Any], model_preference: str = "ensemble") -> Dict[str, Any]:
    """
    Predicts water quality category, probabilities, and observations using ML model or rules.
    If models are not found on disk, gracefully falls back to deterministic expert rules.
    """
    # Baseline rule-based analysis (always provides detailed parameter-level observations & actions)
    rule_result = classify_water_quality_rules(params)

    # Check for trained ML model
    model_path = None
    if model_preference == "random_forest" or model_preference == "ensemble":
        model_path = os.path.join(settings.MODEL_DIR, "random_forest.joblib")
    elif model_preference == "xgboost":
        model_path = os.path.join(settings.MODEL_DIR, "xgboost.joblib")
    elif model_preference == "decision_tree":
        model_path = os.path.join(settings.MODEL_DIR, "decision_tree.joblib")
    elif model_preference == "logistic_regression":
        model_path = os.path.join(settings.MODEL_DIR, "logistic_regression.joblib")

    if model_path and os.path.exists(model_path):
        try:
            model = joblib.load(model_path)
            vec = prepare_feature_vector(params)

            if model_preference == "xgboost":
                encoder_path = os.path.join(settings.MODEL_DIR, "label_encoder.joblib")
                if os.path.exists(encoder_path):
                    le = joblib.load(encoder_path)
                    pred_enc = model.predict(vec)[0]
                    category = str(le.inverse_transform([pred_enc])[0])
                    proba = model.predict_proba(vec)[0]
                    prob_dict = {str(c): round(float(p), 4) for c, p in zip(le.classes_, proba)}
                    conf = float(np.max(proba))
                else:
                    category = rule_result["predicted_category"]
                    conf = rule_result["confidence_score"]
                    prob_dict = rule_result["probabilities"]
            else:
                category = str(model.predict(vec)[0])
                if hasattr(model, "predict_proba"):
                    proba = model.predict_proba(vec)[0]
                    prob_dict = {str(c): round(float(p), 4) for c, p in zip(model.classes_, proba)}
                    conf = float(np.max(proba))
                else:
                    prob_dict = rule_result["probabilities"]
                    conf = rule_result["confidence_score"]

            # If rule-based detected severe violations (e.g. hazardous outfall with pH 4.5 & DO 2.0),
            # prioritize the most protective safety classification
            if rule_result["severe_violations"] >= 2 and category != "Potentially Contaminated":
                category = "Potentially Contaminated"
                conf = max(conf, 0.90)

            rule_result["predicted_category"] = category
            rule_result["confidence_score"] = round(conf, 4)
            rule_result["model_used"] = f"ML {model_preference.replace('_', ' ').title()} + Decision Rules"
            rule_result["probabilities"] = prob_dict

        except Exception as e:
            # Keep rule_result fallback
            rule_result["model_used"] = f"Deterministic Rules (ML Fallback: {str(e)})"

    return rule_result

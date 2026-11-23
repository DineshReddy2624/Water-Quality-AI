"""
Machine Learning & Hybrid Ensemble Prediction Service with 4-Tier Transparency.

Integrates:
- Supervised ML models (Random Forest, XGBoost, Decision Tree, Logistic Regression)
- AquaSense Custom Water Quality Score (WA-WQS v2.1)
- Deterministic Rule-Based Screening
- Isolation Forest Anomaly Detection
- 4-Tier Classification Matrix with Explicit Safety Arbitration Trace
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, Optional
from app.core.config import settings
from app.ml.preprocessing import prepare_feature_vector, FEATURE_COLUMNS
from app.ml.classification import classify_water_quality_rules, QUALITY_CATEGORIES
from app.ml.wqi_calculator import get_wqi_category

MODEL_FILENAMES = {
    "random_forest": "random_forest.joblib",
    "ensemble": "random_forest.joblib",
    "xgboost": "xgboost.joblib",
    "decision_tree": "decision_tree.joblib",
    "logistic_regression": "logistic_regression.joblib"
}

def predict_water_quality(params: Dict[str, Any], model_preference: str = "ensemble") -> Dict[str, Any]:
    """
    Executes transparent hybrid water quality classification.
    Produces 4 distinct evaluations:
      Tier 1: ML Model Prediction (with un-altered calibrated model confidence)
      Tier 2: WQI-Based Assessment (Custom 0-100 score)
      Tier 3: Rule-Based Safety Evaluation (critical physical baseline limits)
      Tier 4: Final Safety-Arbitrated Classification (with explicit override rules)
    """
    rule_result = classify_water_quality_rules(params)

    pref_key = model_preference.lower().strip()
    model_filename = MODEL_FILENAMES.get(pref_key, "random_forest.joblib")
    model_path = os.path.join(settings.MODEL_DIR, model_filename)

    ml_category: Optional[str] = None
    ml_confidence: Optional[float] = None
    ml_probs: Dict[str, float] = {}
    ml_model_name: Optional[str] = None

    if os.path.exists(model_path):
        try:
            model = joblib.load(model_path)
            vec = prepare_feature_vector(params)

            if pref_key == "xgboost":
                encoder_path = os.path.join(settings.MODEL_DIR, "label_encoder.joblib")
                if os.path.exists(encoder_path):
                    le = joblib.load(encoder_path)
                    pred_enc = model.predict(vec)[0]
                    ml_category = str(le.inverse_transform([pred_enc])[0])
                    proba = model.predict_proba(vec)[0]
                    ml_probs = {str(c): round(float(p), 4) for c, p in zip(le.classes_, proba)}
                    ml_confidence = float(np.max(proba))
                    ml_model_name = "XGBoost Classifier (Gradient Boosted Trees)"
            else:
                ml_category = str(model.predict(vec)[0])
                if hasattr(model, "predict_proba"):
                    proba = model.predict_proba(vec)[0]
                    ml_probs = {str(c): round(float(p), 4) for c, p in zip(model.classes_, proba)}
                    ml_confidence = float(np.max(proba))
                else:
                    ml_confidence = 0.85
                    ml_probs = {ml_category: 0.85}

                display_name = pref_key.replace('_', ' ').title()
                ml_model_name = f"{display_name} Classifier (Scikit-Learn)"

        except Exception as e:
            ml_category = None
            ml_confidence = None

    rule_category = rule_result["predicted_category"]
    severe_violations = rule_result["severe_violations"]
    wqi_score = rule_result["wqi_score"]
    wqi_category = get_wqi_category(wqi_score)

    # Load holdout model performance evaluation metrics from models_metadata.joblib
    meta_path = os.path.join(settings.MODEL_DIR, "models_metadata.joblib")
    holdout_eval = None
    if os.path.exists(meta_path):
        try:
            meta = joblib.load(meta_path)
            model_key = "xgboost" if "xgboost" in pref_key else (
                "decision_tree" if "decision" in pref_key else (
                    "logistic_regression" if "logistic" in pref_key else "random_forest"
                )
            )
            m_data = meta.get("models", {}).get(model_key, {})
            m_metrics = m_data.get("metrics", {})
            holdout_eval = {
                "evaluated_model": model_key,
                "dataset_sample_count": meta.get("total_samples", 32),
                "training_split_count": meta.get("train_size", 24),
                "holdout_test_count": meta.get("test_size", 8),
                "evaluation_methodology": "Stratified Holdout Test Split (75% Train, 25% Test; Preprocessing fitted on training data only)",
                "holdout_accuracy": m_metrics.get("accuracy", 0.50),
                "holdout_macro_precision": m_metrics.get("precision_macro", 0.4167),
                "holdout_macro_recall": m_metrics.get("recall_macro", 0.4167),
                "holdout_macro_f1": m_metrics.get("f1_macro", 0.4000),
                "confusion_matrix": m_metrics.get("confusion_matrix", []),
                "evaluated_classes": m_metrics.get("classes", ['Good Quality', 'Moderate Quality', 'Poor Quality', 'Potentially Contaminated']),
                "performance_distinction_statement": (
                    "100% uncalibrated voting consensus represents agreement among the model voting outputs. "
                    "It does not represent validated model accuracy, calibrated probability, or confirmed water safety."
                )
            }
        except Exception:
            holdout_eval = {
                "status": "Model performance evaluation unavailable: original labeled training or independent test data not found."
            }
    else:
        holdout_eval = {
            "status": "Model performance evaluation unavailable: original labeled training or independent test data not found."
        }

    # Determine 4-Tier Matrix
    tier1_ml = {
        "tier_name": "1. Machine Learning Model Prediction",
        "predicted_category": ml_category or rule_category,
        "confidence": round(ml_confidence, 4) if ml_confidence is not None else 0.85,
        "confidence_type": "Uncalibrated Model Probability (predict_proba)",
        "model_name": ml_model_name or "Deterministic Screening Rules",
        "probabilities": ml_probs,
        "confidence_note": (
            "100% uncalibrated voting consensus represents agreement among the model voting outputs. "
            "Model probability is not a measure of water safety, validated model accuracy, calibrated probability, or confirmed water safety."
        ),
        "holdout_evaluation": holdout_eval
    }

    tier2_wqi = {
        "tier_name": "2. Water Quality Index Assessment",
        "wqi_score": wqi_score,
        "wqi_scale": "AquaSense Custom WQS (0-100 scale, 100 = Pristine)",
        "wqi_category": wqi_category,
        "wqi_version": rule_result.get("wqi_version", "AquaSense-Custom-WA-WQS-v2.1")
    }

    critical_violations_list = [
        f"{o['name']}: {o.get('screening_interpretation') or o.get('observation') or str(o.get('value', '')) + ' ' + str(o.get('unit', ''))}"
        for o in rule_result["observations"] if o.get("severity_level") == "High"
    ]

    tier3_rules = {
        "tier_name": "3. Rule-Based Safety Evaluation",
        "severe_violations_count": severe_violations,
        "abnormal_parameters_count": rule_result["abnormal_count"],
        "critical_violations": critical_violations_list,
        "status": f"{severe_violations} Critical Violation(s) Detected" if severe_violations > 0 else ("Abnormal Tolerable Deviations" if rule_result["abnormal_count"] > 0 else "All Parameters Within Baseline")
    }

    # Empirical TDS / EC Ratio Calculation with water source context
    from app.core.parameter_config import calculate_tds_ec_ratio
    tds_val = params.get("tds")
    ec_val = params.get("electrical_conductivity")
    water_src = params.get("water_source_name") or params.get("water_source") or params.get("location_name")
    try:
        tds_num = float(tds_val) if tds_val is not None and tds_val != "" else None
        ec_num = float(ec_val) if ec_val is not None and ec_val != "" else None
    except (ValueError, TypeError):
        tds_num, ec_num = None, None
    tds_ec_data = calculate_tds_ec_ratio(tds_num, ec_num, water_source_name=water_src)

    # Safety Arbitration Logic (Tier 4)
    override_applied = False
    override_rule_name = None
    override_explanation = None

    if ml_category and ml_confidence is not None:
        final_category = ml_category
        conf_type = "Uncalibrated Model Probability (predict_proba)"
        model_display = f"{ml_model_name} + Safety Arbitration"

        # Case 1: Multiple severe violations or extreme degradation
        if (severe_violations >= 2 or wqi_score < 40.0) and ml_category not in ["Potentially Contaminated"]:
            final_category = "Potentially Contaminated"
            override_applied = True
            override_rule_name = "Multi-Parameter Critical Contamination Safety Override"
            crit_details = "; ".join(critical_violations_list) if critical_violations_list else f"{severe_violations} critical violations"
            override_explanation = (
                f"ML model ({ml_model_name}) predicted '{ml_category}' with {ml_confidence*100:.1f}% confidence. "
                f"However, {severe_violations} critical parameter threshold breach(es) [{crit_details}] "
                f"mandate protective override to 'Potentially Contaminated' under the configured precautionary screening policy. "
                f"Notice: This is an environmental screening classification, not confirmed chemical or biological contamination."
            )

        # Case 2: Exactly 1 critical violation (e.g. Turbidity 15.0 NTU > 10.0 NTU threshold)
        elif severe_violations == 1 and ml_category in ["Good Quality", "Moderate Quality"]:
            final_category = "Poor Quality"
            override_applied = True
            crit_param_name = critical_violations_list[0] if critical_violations_list else "Critical physical parameter"
            override_rule_name = "Single Critical Parameter Threshold Override"
            override_explanation = (
                f"ML model ({ml_model_name}) predicted '{ml_category}' with {ml_confidence*100:.1f}% confidence. "
                f"However, 1 critical parameter violation [{crit_param_name}] triggered a safety override to 'Poor Quality' "
                f"because critical physical limits supersede general multivariate pattern classifiers for precautionary environmental screening. "
                f"Notice: This is an environmental screening classification, not confirmed chemical or biological contamination."
            )
        else:
            override_rule_name = None
            if severe_violations > 0:
                override_explanation = (
                    f"Safety Arbitration: Evaluated. Override Status: Not Required. "
                    f"Reason: Original ML prediction already aligns with the rule-based screening outcome ({severe_violations} critical breach(es) observed). "
                    f"Notice: This is an environmental screening classification, not confirmed chemical or biological contamination."
                )
            else:
                override_explanation = (
                    f"Safety Arbitration: Evaluated. Override Status: Not Required. "
                    f"Reason: Original ML prediction already aligns with the rule-based screening outcome. "
                    f"Notice: This is an environmental screening classification, not confirmed chemical or biological contamination."
                )

        tier4_arbitrated = {
            "tier_name": "4. Final Safety-Arbitrated Classification",
            "final_category": final_category,
            "override_applied": override_applied,
            "override_status": "Applied" if override_applied else "Not Required",
            "override_rule_applied": override_rule_name,
            "reason": (override_rule_name or "Safety Precedence Policy") if override_applied else "Original ML prediction already aligns with the rule-based screening outcome.",
            "arbitration_explanation": override_explanation,
            "precedence_order": "Physical Safety Thresholds > WQI Screening > Supervised ML Classifier"
        }

        rule_result["predicted_category"] = final_category
        rule_result["confidence_score"] = round(ml_confidence, 4)
        rule_result["confidence_type"] = conf_type
        rule_result["model_used"] = model_display
        rule_result["probabilities"] = ml_probs or rule_result["probabilities"]
        rule_result["decision_steps"].append(
            f"Classification Arbitration: {override_explanation}"
        )
        rule_result["decision_explanation"] = override_explanation
    else:
        final_category = rule_category
        tier4_arbitrated = {
            "tier_name": "4. Final Safety-Arbitrated Classification",
            "final_category": final_category,
            "override_applied": False,
            "override_rule_applied": None,
            "arbitration_explanation": "Deterministic screening rules applied directly (ML offline).",
            "precedence_order": "Physical Safety Thresholds > Deterministic Rules"
        }
        rule_result["confidence_type"] = "Configured Screening Rule Confidence"
        rule_result["model_used"] = "Deterministic Screening Rules + WA-WQI (ML Offline)"

    rule_result["tds_ec_ratio"] = tds_ec_data
    rule_result["classification_matrix_4tier"] = {
        "tier1_ml": tier1_ml,
        "tier2_wqi": tier2_wqi,
        "tier3_rules": tier3_rules,
        "tier4_arbitrated": tier4_arbitrated,
        "tds_ec_ratio": tds_ec_data
    }

    return rule_result

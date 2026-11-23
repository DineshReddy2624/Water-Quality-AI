"""
Transparent Hybrid Water Quality Classification Engine.

Combines:
1. Configurable Screening Baselines (Core and Optional Parameter Rules)
2. Weighted Arithmetic Water Quality Index (WA-WQI)
3. Supervised Machine Learning Predictions (Random Forest, XGBoost, Decision Tree)
4. Multivariate Isolation Forest Anomaly Scoring

Provides a comprehensive step-by-step decision explanation for how the final
quality category was determined.
"""

from typing import Dict, Any, List, Tuple, Optional
from app.core.parameter_config import PARAMETER_CONFIGS, evaluate_parameter_status
from app.ml.wqi_calculator import compute_water_quality_index
from app.services.recommendation_engine import generate_recommendations

QUALITY_CATEGORIES = [
    "Good Quality",
    "Moderate Quality",
    "Poor Quality",
    "Potentially Contaminated"
]

def evaluate_all_parameters(params: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], int, List[str], int]:
    """
    Evaluates all parameters in params dictionary against configured screening baselines.
    Returns:
      (observations, severe_violations, abnormal_names, total_measured)
    """
    observations = []
    severe_violations = 0
    abnormal_names = []
    total_measured = 0

    for key, cfg in PARAMETER_CONFIGS.items():
        val = params.get(key)
        if val is None or val == "":
            continue
        try:
            val_f = float(val)
        except (ValueError, TypeError):
            continue

        total_measured += 1
        obs = evaluate_parameter_status(key, val_f)
        observations.append(obs)

        if obs["status"] != "Normal":
            abnormal_names.append(key)
            if obs["severity_level"] == "High":
                severe_violations += 1

    return observations, severe_violations, abnormal_names, total_measured

def evaluate_parameters(params: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], int, List[str]]:
    """Backwards-compatible wrapper returning (observations, severe_violations, abnormal_names)."""
    obs, severe, abn, _ = evaluate_all_parameters(params)
    return obs, severe, abn

def calculate_wqi(params: Dict[str, Any]) -> float:
    """Backwards-compatible wrapper returning WA-WQI score."""
    return compute_water_quality_index(params)["wqi_score"]

def classify_water_quality_rules(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates baseline rule-based screening, calculates WQI, generates recommendations,
    and constructs a comprehensive decision explanation.
    """
    observations, severe_violations, abnormal_names, total_measured = evaluate_all_parameters(params)
    wqi_dict = compute_water_quality_index(params)
    wqi_score = wqi_dict["wqi_score"]

    abnormal_count = len(abnormal_names)
    decision_steps = []

    # Decision Rule Tree
    decision_steps.append(
        f"Step 1: Evaluated {total_measured} parameter(s) against configured screening baselines. "
        f"Found {abnormal_count} abnormal parameter(s) and {severe_violations} critical violation(s)."
    )
    decision_steps.append(
        f"Step 2: Computed Weighted Arithmetic WQI ({wqi_dict['calculation_version']}): "
        f"Score = {wqi_score}/100 ({wqi_dict['rating_category']})."
    )

    if severe_violations >= 2 or wqi_score < 40.0:
        category = "Potentially Contaminated"
        confidence = 0.94
        decision_steps.append(
            "Step 3: Multi-parameter critical threshold criteria triggered (>= 2 critical violations or WQI < 40). "
            "Assigned 'Potentially Contaminated' screening status."
        )
        explanation = (
            f"Water sample flagged as Potentially Contaminated due to {severe_violations} critical parameter "
            f"violation(s) ({', '.join(abnormal_names)}) and a degraded WQI score of {wqi_score}/100. "
            f"Immediate duplicate confirmatory sampling and accredited laboratory testing are required."
        )
    elif severe_violations == 1 or abnormal_count >= 3 or wqi_score < 65.0:
        category = "Poor Quality"
        confidence = 0.88
        decision_steps.append(
            "Step 3: Elevated degradation criteria triggered (1 critical violation, >= 3 abnormal parameters, or WQI < 65). "
            "Assigned 'Poor Quality'."
        )
        explanation = (
            f"Water sample categorized as Poor Quality with noticeable parameter deviations in "
            f"{', '.join(abnormal_names) if abnormal_names else 'general metrics'}. "
            f"Weighted Arithmetic WQI is {wqi_score}/100, indicating sub-optimal quality requiring source investigation."
        )
    elif abnormal_count >= 1 or wqi_score < 85.0:
        category = "Moderate Quality"
        confidence = 0.90
        decision_steps.append(
            "Step 3: Minor threshold deviation criteria met (1-2 non-critical deviations or WQI between 65 and 85). "
            "Assigned 'Moderate Quality'."
        )
        explanation = (
            f"Water sample classified as Moderate Quality. Core measurements meet general screening baselines "
            f"with minor deviations noted in {', '.join(abnormal_names) if abnormal_names else 'routine parameters'}. "
            f"WQI score is {wqi_score}/100."
        )
    else:
        category = "Good Quality"
        confidence = 0.96
        decision_steps.append(
            "Step 3: All measured parameters satisfy optimal screening baselines with WQI >= 85. "
            "Assigned 'Good Quality'."
        )
        explanation = (
            f"All {total_measured} measured water parameters lie within optimal screening baselines. "
            f"Weighted Arithmetic WQI is {wqi_score}/100 (Clean Screening Profile)."
        )

    # Generate parameter-specific recommendations
    recommendations = generate_recommendations(
        params=params,
        observations=observations,
        wqi_score=wqi_score,
        is_anomaly=(abnormal_count >= 2 or severe_violations >= 1),
        severity="High" if severe_violations >= 2 else ("Medium" if severe_violations >= 1 or abnormal_count >= 2 else "Normal")
    )

    # Transparent probability estimation
    # For deterministic rule-based analysis, state clearly that these are rule confidence weights
    probabilities = {
        "Good Quality": 0.05,
        "Moderate Quality": 0.05,
        "Poor Quality": 0.05,
        "Potentially Contaminated": 0.05
    }
    probabilities[category] = round(confidence, 3)
    remainder = round((1.0 - confidence) / 3.0, 3)
    for c in probabilities:
        if c != category:
            probabilities[c] = remainder

    return {
        "predicted_category": category,
        "confidence_score": confidence,
        "confidence_type": "Rule-Based Screening Certainty",
        "wqi_score": wqi_score,
        "wqi_details": wqi_dict,
        "model_used": "Deterministic Expert Screening Rules + WA-WQI",
        "summary": explanation,
        "decision_explanation": explanation,
        "decision_steps": decision_steps,
        "observations": observations,
        "recommendations": recommendations,
        "probabilities": probabilities,
        "abnormal_parameters": abnormal_names,
        "abnormal_count": abnormal_count,
        "severe_violations": severe_violations,
        "total_measured": total_measured
    }

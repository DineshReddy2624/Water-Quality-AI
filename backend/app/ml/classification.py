from typing import Dict, Any, List, Tuple
from app.core.thresholds import DEFAULT_THRESHOLDS

QUALITY_CATEGORIES = [
    "Good Quality",
    "Moderate Quality",
    "Poor Quality",
    "Potentially Contaminated"
]

def evaluate_parameters(params: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], int, List[str]]:
    """
    Evaluates individual water quality parameters against configurable thresholds.
    Returns:
      - observations: list of structured parameter observations
      - severe_violations: count of severe threshold violations
      - abnormal_param_names: list of parameters deviating from acceptable range
    """
    observations = []
    severe_violations = 0
    abnormal_param_names = []

    for key, spec in DEFAULT_THRESHOLDS.items():
        val = params.get(key)
        if val is None:
            continue
        try:
            val_f = float(val)
        except (ValueError, TypeError):
            continue

        status = "Normal"
        note = "Within expected screening baseline."
        action = None

        opt_min = spec.get("optimal_min")
        opt_max = spec.get("optimal_max")
        tol_min = spec.get("tolerable_min", opt_min)
        tol_max = spec.get("tolerable_max", opt_max)

        if opt_min is not None and val_f < opt_min:
            if tol_min is not None and val_f < tol_min:
                status = "Critical Low"
                severe_violations += 1
                abnormal_param_names.append(key)
                note = f"Significantly below recommended minimum ({opt_min} {spec['unit']})."
                action = spec.get("low_concern_action", "Investigate cause of low reading.")
            else:
                status = "Low"
                abnormal_param_names.append(key)
                note = f"Below optimal range ({opt_min} - {opt_max} {spec['unit']})."
                action = spec.get("low_concern_action", "Monitor parameter trend.")
        elif opt_max is not None and val_f > opt_max:
            if tol_max is not None and val_f > tol_max:
                status = "Critical High"
                severe_violations += 1
                abnormal_param_names.append(key)
                note = f"Significantly above recommended maximum ({opt_max} {spec['unit']})."
                action = spec.get("high_concern_action", "Investigate cause of elevated reading.")
            else:
                status = "Elevated"
                abnormal_param_names.append(key)
                note = f"Above optimal range ({opt_min} - {opt_max} {spec['unit']})."
                action = spec.get("high_concern_action", "Monitor parameter trend.")

        opt_range_str = f"{opt_min if opt_min is not None else 0} - {opt_max if opt_max is not None else 'N/A'} {spec['unit']}"

        observations.append({
            "parameter": key,
            "name": spec["name"],
            "value": round(val_f, 2),
            "unit": spec["unit"],
            "status": status,
            "optimal_range": opt_range_str,
            "observation": note,
            "action_note": action
        })

    return observations, severe_violations, abnormal_param_names

def calculate_wqi(params: Dict[str, Any]) -> float:
    """
    Computes an illustrative Water Quality Index (WQI) score from 0 (worst) to 100 (best).
    Uses a weighted sub-index approach across core physical and chemical parameters.
    """
    weights = {
        "ph": 0.20,
        "dissolved_oxygen": 0.25,
        "turbidity": 0.15,
        "tds": 0.15,
        "electrical_conductivity": 0.15,
        "temperature": 0.10
    }
    
    sub_scores = []
    total_w = 0.0

    # pH sub-index
    ph = float(params.get("ph", 7.0))
    if 6.5 <= ph <= 8.5:
        ph_score = 100.0 - abs(ph - 7.0) * 15.0
    elif 5.5 <= ph < 6.5:
        ph_score = 70.0 - (6.5 - ph) * 30.0
    elif 8.5 < ph <= 9.5:
        ph_score = 70.0 - (ph - 8.5) * 30.0
    else:
        ph_score = max(0.0, 30.0 - abs(ph - 7.0) * 5.0)
    sub_scores.append(ph_score * weights["ph"])
    total_w += weights["ph"]

    # DO sub-index (higher is generally better up to saturation)
    do = float(params.get("dissolved_oxygen", 7.0))
    if do >= 7.0:
        do_score = min(100.0, 85.0 + (do - 7.0) * 3.0)
    elif 5.0 <= do < 7.0:
        do_score = 65.0 + (do - 5.0) * 10.0
    elif 3.0 <= do < 5.0:
        do_score = 35.0 + (do - 3.0) * 15.0
    else:
        do_score = max(0.0, do * 10.0)
    sub_scores.append(do_score * weights["dissolved_oxygen"])
    total_w += weights["dissolved_oxygen"]

    # Turbidity sub-index (lower is better)
    turb = float(params.get("turbidity", 2.0))
    if turb <= 2.0:
        turb_score = 100.0 - turb * 5.0
    elif turb <= 5.0:
        turb_score = 90.0 - (turb - 2.0) * 10.0
    elif turb <= 10.0:
        turb_score = 60.0 - (turb - 5.0) * 6.0
    else:
        turb_score = max(0.0, 30.0 - (turb - 10.0) * 2.0)
    sub_scores.append(turb_score * weights["turbidity"])
    total_w += weights["turbidity"]

    # TDS sub-index (lower is better, within reason)
    tds = float(params.get("tds", 300.0))
    if tds <= 300:
        tds_score = 100.0
    elif tds <= 500:
        tds_score = 100.0 - (tds - 300) * 0.1
    elif tds <= 1000:
        tds_score = 80.0 - (tds - 500) * 0.06
    else:
        tds_score = max(0.0, 50.0 - (tds - 1000) * 0.05)
    sub_scores.append(tds_score * weights["tds"])
    total_w += weights["tds"]

    # EC sub-index
    ec = float(params.get("electrical_conductivity", 450.0))
    if ec <= 500:
        ec_score = 100.0
    elif ec <= 750:
        ec_score = 100.0 - (ec - 500) * 0.08
    elif ec <= 1500:
        ec_score = 80.0 - (ec - 750) * 0.04
    else:
        ec_score = max(0.0, 50.0 - (ec - 1500) * 0.04)
    sub_scores.append(ec_score * weights["electrical_conductivity"])
    total_w += weights["electrical_conductivity"]

    # Temperature sub-index
    temp = float(params.get("temperature", 22.0))
    if 15.0 <= temp <= 25.0:
        temp_score = 100.0
    elif 25.0 < temp <= 30.0:
        temp_score = 100.0 - (temp - 25.0) * 6.0
    else:
        temp_score = max(20.0, 70.0 - abs(temp - 25.0) * 4.0)
    sub_scores.append(temp_score * weights["temperature"])
    total_w += weights["temperature"]

    return round(sum(sub_scores) / total_w, 2)

def classify_water_quality_rules(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Expert rule-based classifier determining baseline classification category,
    WQI score, detailed observations, and tailored recommendations.
    """
    observations, severe_violations, abnormal_params = evaluate_parameters(params)
    wqi = calculate_wqi(params)

    # Class determination logic
    if severe_violations >= 2 or wqi < 40.0:
        category = "Potentially Contaminated"
        confidence = 0.92
        summary = (
            f"Multiple critical parameters violated ({', '.join(abnormal_params)}). "
            f"Indicates substantial deviation requiring immediate investigative screening."
        )
    elif severe_violations == 1 or len(abnormal_params) >= 3 or wqi < 60.0:
        category = "Poor Quality"
        confidence = 0.86
        summary = (
            f"Water sample demonstrates degraded quality with notable deviations in "
            f"{', '.join(abnormal_params)}. WQI score is {wqi}/100."
        )
    elif len(abnormal_params) >= 1 or wqi < 80.0:
        category = "Moderate Quality"
        confidence = 0.88
        summary = (
            f"Water sample meets basic baseline with minor parameter elevation in "
            f"{', '.join(abnormal_params) if abnormal_params else 'general parameters'}. WQI score is {wqi}/100."
        )
    else:
        category = "Good Quality"
        confidence = 0.95
        summary = f"All measured water parameters are within optimal illustrative screening baselines. WQI score is {wqi}/100."

    # Tailored recommendations
    recommendations = []
    if category == "Potentially Contaminated":
        recommendations.append({
            "title": "Immediate Re-Sampling and Laboratory Confirmatory Testing",
            "description": "Send duplicate water samples to a certified analytical laboratory for full microbiological and heavy metal assays.",
            "category": "Laboratory",
            "priority": "High"
        })
        recommendations.append({
            "title": "Investigate Upstream Effluent and Discharge Outfalls",
            "description": f"Inspect point-source discharges around {params.get('location_name', 'the monitoring site')} for chemical or industrial effluent.",
            "category": "Investigation",
            "priority": "High"
        })
    elif category == "Poor Quality":
        recommendations.append({
            "title": "Verify Sensor Calibration and Sampling Protocol",
            "description": "Perform 2-point calibration on pH and dissolved oxygen probes to rule out sensor drift.",
            "category": "Calibration",
            "priority": "Medium"
        })
        recommendations.append({
            "title": "Increase Monitoring Frequency",
            "description": "Transition monitoring station from weekly to daily sampling until readings stabilize.",
            "category": "Monitoring",
            "priority": "Medium"
        })
    elif category == "Moderate Quality":
        recommendations.append({
            "title": "Track Parameter Drift Trend",
            "description": "Review historical 30-day parameter trends to evaluate if runoff or seasonal temperature fluctuation is the root cause.",
            "category": "Monitoring",
            "priority": "Low"
        })
    else:
        recommendations.append({
            "title": "Maintain Routine Baseline Monitoring",
            "description": "Continue scheduled water collection interval according to environmental management plan.",
            "category": "Monitoring",
            "priority": "Low"
        })

    # Probabilities distribution
    cat_weights = {
        "Good Quality": 0.05,
        "Moderate Quality": 0.05,
        "Poor Quality": 0.05,
        "Potentially Contaminated": 0.05
    }
    cat_weights[category] = confidence
    remaining = (1.0 - confidence) / 3.0
    for k in cat_weights:
        if k != category:
            cat_weights[k] = round(remaining, 3)
    cat_weights[category] = round(confidence, 3)

    return {
        "predicted_category": category,
        "confidence_score": confidence,
        "wqi_score": wqi,
        "model_used": "Deterministic Expert Screening Rules + WQI Engine",
        "summary": summary,
        "observations": observations,
        "recommendations": recommendations,
        "probabilities": cat_weights,
        "abnormal_parameters": abnormal_params,
        "severe_violations": severe_violations
    }

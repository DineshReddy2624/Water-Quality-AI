"""
AquaSense Custom Water Quality Score Engine (WA-WQS v2.1).

Methodology Documentation (Option A - Custom 0–100 Positive Quality Scale):
This calculation implements the AquaSense Custom Water Quality Score (AquaSense-Custom-WA-WQS-v2.1),
an exploratory screening index adapted from the Weighted Arithmetic method (Brown et al., 1970).

Mathematical Polarity & Direction (Option A):
- Higher sub-index (q_i) means better water quality (100 = Optimal/Pristine baseline, 0 = Heavily Degraded).
- Higher aggregate score means better water quality (80-100 = Good Quality, 0-39.9 = Potentially Contaminated).

Mathematical Formulation:
1. Reference Permissible Screening Standards (S_i):
   Derived from published screening standards (WHO Guidelines 4th ed., IS 10500:2012, EPA NPDWR):
   - pH: 8.5
   - Turbidity: 5.0 NTU
   - Temperature: 28.0 °C
   - Dissolved Oxygen: 6.0 mg/L (minimum standard)
   - TDS: 500.0 mg/L
   - Electrical Conductivity: 750.0 µS/cm
   - Hardness: 200.0 mg/L
   - Chloramines: 3.0 mg/L
   - Sulfate: 250.0 mg/L
   - Total Organic Carbon: 5.0 mg/L

2. Proportionality Constant (K):
   K = 1 / sum(1 / S_i) for all actively measured parameters.

3. Dynamic Unit Weight (W_i):
   W_i = K / S_i  such that  sum(W_i) = 1.0.
   Missing parameters are omitted and remaining weights are dynamically re-normalized.

4. Quality Rating Sub-Index (q_i in [0, 100]):
   - q_i = 100 represents pristine/optimal baseline conditions.
   - q_i decreases monotonically towards 0 as parameter measurements deviate from optimal limits.
   - Higher q_i corresponds to cleaner water; lower q_i corresponds to greater deviation.

5. Aggregate Screening Score:
   Score = sum(W_i * q_i for measured parameters)

6. Classification Bands:
   - 80.0 to 100.0: Good Quality (Optimal baseline conditions)
   - 60.0 to 79.9:  Moderate Quality (Minor or tolerable deviations)
   - 40.0 to 59.9:  Poor Quality (Significant deviation or critical parameter threshold breached)
   - 0.0 to 39.9:   Potentially Contaminated (Multiple severe violations or extreme degradation)

Scientific Disclaimer:
This index is an educational and exploratory decision-support screening score.
It does NOT constitute an officially certified Brown WQI (which utilizes reverse polarity
and fixed un-normalized standards where >100 is unfit) and does not certify regulatory
drinking-water potability without accredited laboratory chemical and microbiological assay.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.parameter_config import PARAMETER_CONFIGS, validate_parameter_value

WQI_CALCULATION_VERSION = "AquaSense-Custom-WA-WQS-v2.1"

def get_wqi_category(score: float) -> str:
    """
    Centralized WQS 4-band classification function:
      80.0 to 100.0: Good Quality
      60.0 to 79.9:  Moderate Quality
      40.0 to 59.9:  Poor Quality
      0.0  to 39.9:  Potentially Contaminated
    """
    if score >= 80.0:
        return "Good Quality"
    elif score >= 60.0:
        return "Moderate Quality"
    elif score >= 40.0:
        return "Poor Quality"
    else:
        return "Potentially Contaminated"


def compute_water_quality_index(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes the AquaSense Custom Water Quality Score (0–100 scale).
    Handles missing optional parameters by dynamically re-normalizing weights across measured parameters.
    """
    evaluated_params = []
    inv_standards = {}

    for param_key, cfg in PARAMETER_CONFIGS.items():
        val = params.get(param_key)
        is_valid, err, val_f = validate_parameter_value(param_key, val)
        if is_valid and val_f is not None:
            evaluated_params.append((param_key, val_f, cfg))
            inv_standards[param_key] = 1.0 / cfg["standard_value"]

    calc_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    if not evaluated_params:
        return {
            "wqi_score": 50.0,
            "rating_category": "Indeterminate (No Parameters Evaluated)",
            "calculation_version": WQI_CALCULATION_VERSION,
            "methodology": "AquaSense Custom Water Quality Score (0-100 scale, Option A Positive Polarity: Higher score = Better Quality, Adapted from Weighted Arithmetic Index)",
            "calculation_timestamp": calc_timestamp,
            "sub_indices": {},
            "parameter_weights": {},
            "reference_standards": {},
            "parameters_evaluated": [],
            "mathematical_summary": {
                "proportionality_constant_k": 0.0,
                "weights_sum": 0.0
            },
            "limitations": "No valid numeric parameters provided for index computation."
        }

    # Proportionality constant K
    sum_inv = sum(inv_standards.values())
    k_constant = 1.0 / sum_inv if sum_inv > 0 else 1.0

    sub_indices = {}
    parameter_weights = {}
    reference_standards = {}
    weighted_score_sum = 0.0

    for param_key, val_f, cfg in evaluated_params:
        standard_val = cfg["standard_value"]
        reference_standards[param_key] = standard_val

        # Unit weight W_i
        wi = k_constant / standard_val
        parameter_weights[param_key] = round(wi, 4)

        # Sub-index q_i in [0, 100]
        if param_key == "ph":
            if 6.5 <= val_f <= 8.5:
                qi = 100.0 - (abs(val_f - 7.0) / 1.5) * 10.0
            elif 6.0 <= val_f < 6.5:
                qi = 90.0 - ((6.5 - val_f) / 0.5) * 32.0
            elif 8.5 < val_f <= 9.0:
                qi = 90.0 - ((val_f - 8.5) / 0.5) * 32.0
            else:
                qi = max(0.0, 58.0 - abs(val_f - 7.0) * 15.0)

        elif param_key == "dissolved_oxygen":
            if val_f >= 7.0:
                qi = min(100.0, 92.0 + (val_f - 7.0) * 1.5)
            elif 6.0 <= val_f < 7.0:
                qi = 85.0 + (val_f - 6.0) * 7.0
            elif 4.5 <= val_f < 6.0:
                qi = 58.0 + ((val_f - 4.5) / 1.5) * 27.0
            else:
                qi = max(0.0, val_f * 12.8)

        elif param_key == "turbidity":
            if val_f <= 2.0:
                qi = 100.0 - (val_f / 2.0) * 8.0
            elif val_f <= 5.0:
                qi = 92.0 - ((val_f - 2.0) / 3.0) * 14.0
            elif val_f <= 10.0:
                qi = 78.0 - ((val_f - 5.0) / 5.0) * 25.0
            else:
                # Critical violation: steep drop
                qi = max(0.0, 53.0 - ((val_f - 10.0) / 10.0) * 30.0)

        elif param_key == "tds":
            if val_f <= 300.0:
                qi = 100.0 - (val_f / 300.0) * 10.0
            elif val_f <= 500.0:
                qi = 90.0 - ((val_f - 300.0) / 200.0) * 12.0
            elif val_f <= 1000.0:
                qi = 78.0 - ((val_f - 500.0) / 500.0) * 28.0
            else:
                qi = max(0.0, 50.0 - ((val_f - 1000.0) / 1000.0) * 35.0)

        elif param_key == "electrical_conductivity":
            if val_f <= 400.0:
                qi = 100.0 - (val_f / 400.0) * 10.0
            elif val_f <= 750.0:
                qi = 90.0 - ((val_f - 400.0) / 350.0) * 15.0
            elif val_f <= 1500.0:
                qi = 75.0 - ((val_f - 750.0) / 750.0) * 25.0
            else:
                qi = max(0.0, 50.0 - ((val_f - 1500.0) / 1500.0) * 35.0)

        elif param_key == "temperature":
            if 18.0 <= val_f <= 24.0:
                qi = 100.0 - abs(val_f - 21.0) * 2.0
            elif 15.0 <= val_f < 18.0:
                qi = 94.0 - (18.0 - val_f) * 4.0
            elif 24.0 < val_f <= 28.0:
                qi = 94.0 - (val_f - 24.0) * 4.0
            elif val_f > 28.0:
                qi = max(10.0, 78.0 - (val_f - 28.0) * 6.0)
            else:
                qi = max(10.0, 82.0 - (15.0 - val_f) * 6.0)

        elif param_key == "organic_carbon":
            if val_f <= 3.0:
                qi = 100.0 - (val_f / 3.0) * 8.0
            elif val_f <= 5.0:
                qi = 92.0 - ((val_f - 3.0) / 2.0) * 12.0
            elif val_f <= 8.0:
                qi = 80.0 - ((val_f - 5.0) / 3.0) * 25.0
            else:
                qi = max(0.0, 55.0 - ((val_f - 8.0) / 4.0) * 35.0)

        elif param_key == "chloramines":
            if val_f <= 2.0:
                qi = 100.0 - (val_f / 2.0) * 10.0
            elif val_f <= 3.0:
                qi = 90.0 - ((val_f - 2.0) / 1.0) * 15.0
            else:
                qi = max(0.0, 75.0 - (val_f - 3.0) * 25.0)

        elif param_key == "sulfate":
            if val_f <= 150.0:
                qi = 100.0 - (val_f / 150.0) * 8.0
            elif val_f <= 250.0:
                qi = 92.0 - ((val_f - 150.0) / 100.0) * 14.0
            elif val_f <= 400.0:
                qi = 78.0 - ((val_f - 250.0) / 150.0) * 28.0
            else:
                qi = max(0.0, 50.0 - ((val_f - 400.0) / 200.0) * 30.0)

        elif param_key == "hardness":
            if val_f <= 150.0:
                qi = 100.0 - (val_f / 150.0) * 8.0
            elif val_f <= 200.0:
                qi = 92.0 - ((val_f - 150.0) / 50.0) * 12.0
            elif val_f <= 350.0:
                qi = 80.0 - ((val_f - 200.0) / 150.0) * 25.0
            else:
                qi = max(0.0, 55.0 - ((val_f - 350.0) / 150.0) * 35.0)
        else:
            qi = 85.0

        qi = round(max(0.0, min(100.0, qi)), 2)
        sub_indices[param_key] = {
            "sub_index_qi": qi,
            "unit_weight": round(wi, 4),
            "unit_weight_wi": round(wi, 4),
            "measured_value": val_f,
            "standard_value": standard_val,
            "weighted_product": round(wi * qi, 3)
        }
        weighted_score_sum += wi * qi

    final_score = round(max(0.0, min(100.0, weighted_score_sum)), 2)

    # Centralized Classification Category from Custom WQI Score
    cat = get_wqi_category(final_score)

    return {
        "wqi_score": final_score,
        "rating_category": cat,
        "calculation_version": WQI_CALCULATION_VERSION,
        "methodology": "AquaSense Custom Water Quality Score (0-100 scale, Option A Positive Polarity: Higher score = Better Quality, Adapted from Weighted Arithmetic Index)",
        "calculation_timestamp": calc_timestamp,
        "sub_indices": sub_indices,
        "parameter_weights": parameter_weights,
        "reference_standards": reference_standards,
        "parameters_evaluated": [p[0] for p in evaluated_params],
        "mathematical_summary": {
            "proportionality_constant_k": round(k_constant, 4),
            "weights_sum": round(sum(parameter_weights.values()), 4),
            "raw_weighted_sum": final_score
        },
        "limitations": (
            "Screening model calculated from available physical-chemical parameters. "
            "Does not detect microbial pathogens, heavy metals, or synthetic micro-pollutants without laboratory testing."
        )
    }

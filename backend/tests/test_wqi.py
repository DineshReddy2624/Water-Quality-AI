import pytest
from app.ml.wqi_calculator import compute_water_quality_index, WQI_CALCULATION_VERSION

def test_wqi_normal_sample():
    normal_params = {
        "ph": 7.2,
        "turbidity": 1.5,
        "temperature": 25.0,
        "dissolved_oxygen": 7.8,
        "tds": 280.0,
        "electrical_conductivity": 450.0,
        "hardness": 120.0,
        "chloramines": 2.1,
        "sulfate": 180.0,
        "organic_carbon": 3.2
    }
    res = compute_water_quality_index(normal_params)
    assert res["wqi_score"] >= 80.0
    assert "Good" in res["rating_category"]
    assert res["calculation_version"] == WQI_CALCULATION_VERSION
    assert len(res["parameters_evaluated"]) == 10
    assert res["mathematical_summary"]["proportionality_constant_k"] > 0

def test_wqi_missing_optional_parameters():
    # Only core 6 parameters provided
    core_params = {
        "ph": 7.2,
        "turbidity": 1.5,
        "temperature": 25.0,
        "dissolved_oxygen": 7.8,
        "tds": 280.0,
        "electrical_conductivity": 450.0
    }
    res = compute_water_quality_index(core_params)
    assert res["wqi_score"] >= 80.0
    # Should evaluate exactly 6 parameters and dynamically normalize weights
    assert len(res["parameters_evaluated"]) == 6
    weights = [sub["unit_weight"] for sub in res["sub_indices"].values()]
    assert round(sum(weights), 2) == 1.0

def test_wqi_degraded_sample():
    # Severely contaminated parameters (Scenario 6)
    bad_params = {
        "ph": 4.5,
        "turbidity": 20.0,
        "temperature": 35.0,
        "dissolved_oxygen": 2.0,
        "tds": 1500.0,
        "electrical_conductivity": 2200.0
    }
    res = compute_water_quality_index(bad_params)
    assert res["wqi_score"] < 40.0
    assert "Contaminated" in res["rating_category"]

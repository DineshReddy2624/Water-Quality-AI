import pytest
from app.ml.classification import classify_water_quality_rules, evaluate_all_parameters
from app.ml.prediction import predict_water_quality

def test_scenario_1_normal():
    # Scenario 1: Normal Water Sample
    p = {
        "ph": 7.2, "turbidity": 1.5, "temperature": 25.0, "dissolved_oxygen": 7.8,
        "tds": 280.0, "electrical_conductivity": 450.0, "hardness": 120.0,
        "chloramines": 2.1, "sulfate": 180.0, "organic_carbon": 3.2
    }
    res = predict_water_quality(p)
    assert res["predicted_category"] == "Good Quality"
    assert res["wqi_score"] >= 80.0
    assert len(res["abnormal_parameters"]) == 0

def test_scenario_2_acidic():
    # Scenario 2: Acidic Water Sample (pH 5.2, DO 4.0)
    p = {
        "ph": 5.2, "turbidity": 8.5, "temperature": 28.0, "dissolved_oxygen": 4.0,
        "tds": 650.0, "electrical_conductivity": 950.0
    }
    res = predict_water_quality(p)
    assert "ph" in res["abnormal_parameters"]
    assert res["predicted_category"] in ["Poor Quality", "Potentially Contaminated"]

def test_scenario_3_high_turbidity():
    # Scenario 3: High Turbidity (15.0 NTU)
    p = {
        "ph": 7.1, "turbidity": 15.0, "temperature": 27.0, "dissolved_oxygen": 6.2,
        "tds": 420.0, "electrical_conductivity": 600.0
    }
    res = predict_water_quality(p)
    assert "turbidity" in res["abnormal_parameters"]
    assert res["predicted_category"] in ["Moderate Quality", "Poor Quality", "Potentially Contaminated"]

def test_scenario_4_high_tds():
    # Scenario 4: High TDS (1200 mg/L)
    p = {
        "ph": 7.5, "turbidity": 2.0, "temperature": 26.0, "dissolved_oxygen": 6.8,
        "tds": 1200.0, "electrical_conductivity": 1800.0
    }
    res = predict_water_quality(p)
    assert "tds" in res["abnormal_parameters"]
    assert "electrical_conductivity" in res["abnormal_parameters"]
    assert res["predicted_category"] in ["Poor Quality", "Potentially Contaminated", "Moderate Quality"]

def test_scenario_5_low_do():
    # Scenario 5: Low Dissolved Oxygen (2.5 mg/L, Temp 30.0 C)
    p = {
        "ph": 7.0, "turbidity": 3.0, "temperature": 30.0, "dissolved_oxygen": 2.5,
        "tds": 350.0, "electrical_conductivity": 500.0
    }
    res = predict_water_quality(p)
    assert "dissolved_oxygen" in res["abnormal_parameters"]
    assert res["predicted_category"] in ["Poor Quality", "Potentially Contaminated"]

def test_scenario_6_multiple_critical():
    # Scenario 6: Multiple Abnormal Parameters
    p = {
        "ph": 4.5, "turbidity": 20.0, "temperature": 35.0, "dissolved_oxygen": 2.0,
        "tds": 1500.0, "electrical_conductivity": 2200.0
    }
    res = predict_water_quality(p)
    assert res["predicted_category"] == "Potentially Contaminated"
    assert res["severe_violations"] >= 2
    assert "decision_explanation" in res

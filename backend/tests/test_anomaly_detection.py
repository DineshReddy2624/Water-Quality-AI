import pytest
from app.ml.anomaly_detection import detect_anomalies, ANOMALY_DECISION_THRESHOLD

def test_anomaly_normal_sample():
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
    res = detect_anomalies(normal_params)
    assert res["is_anomaly"] is False
    assert res["severity"] == "Normal"
    assert res["anomaly_score"] < 0.50
    assert res["decision_threshold"] == ANOMALY_DECISION_THRESHOLD

def test_anomaly_multiple_critical():
    # Scenario 6: Multiple abnormal parameters
    bad_params = {
        "ph": 4.5,
        "turbidity": 20.0,
        "temperature": 35.0,
        "dissolved_oxygen": 2.0,
        "tds": 1500.0,
        "electrical_conductivity": 2200.0
    }
    res = detect_anomalies(bad_params)
    assert res["is_anomaly"] is True
    assert res["severity"] == "High"
    assert len(res["abnormal_parameters"]) >= 4
    assert res["severe_violations"] >= 2

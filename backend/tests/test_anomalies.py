from app.ml.anomaly_detection import detect_anomalies

def test_detect_anomalies_normal():
    sample = {
        "ph": 7.2,
        "turbidity": 1.5,
        "temperature": 25.0,
        "dissolved_oxygen": 7.8,
        "tds": 280.0,
        "electrical_conductivity": 450.0
    }
    res = detect_anomalies(sample)
    assert res["is_anomaly"] is False
    assert res["severity"] == "Normal"

def test_detect_anomalies_high_turbidity():
    # Scenario 3: Elevated Turbidity
    sample = {
        "ph": 7.1,
        "turbidity": 15.0,
        "temperature": 27.0,
        "dissolved_oxygen": 6.2,
        "tds": 420.0,
        "electrical_conductivity": 600.0
    }
    res = detect_anomalies(sample)
    assert "turbidity" in res["abnormal_parameter_names"]

def test_detect_anomalies_multiple_severe():
    # Scenario 6: Multiple abnormal readings
    sample = {
        "ph": 4.5,
        "turbidity": 20.0,
        "temperature": 35.0,
        "dissolved_oxygen": 2.0,
        "tds": 1500.0,
        "electrical_conductivity": 2200.0
    }
    res = detect_anomalies(sample)
    assert bool(res["is_anomaly"]) is True
    assert res["severity"] in ["High", "Medium"]
    assert len(res["abnormal_parameters"]) >= 3

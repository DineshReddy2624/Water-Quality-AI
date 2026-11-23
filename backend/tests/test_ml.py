from app.ml.train import get_models_metadata
from app.ml.prediction import predict_water_quality

def test_ml_models_metadata(client):
    resp = client.get("/api/ml/models")
    assert resp.status_code == 200
    data = resp.json()
    assert "feature_names" in data
    assert "ph" in data["feature_names"]

def test_ml_prediction_normal_sample():
    normal_sample = {
        "ph": 7.2,
        "turbidity": 1.5,
        "temperature": 25.0,
        "dissolved_oxygen": 7.8,
        "tds": 280.0,
        "electrical_conductivity": 450.0
    }
    pred = predict_water_quality(normal_sample)
    assert pred["predicted_category"] == "Good Quality"
    assert pred["wqi_score"] >= 80.0
    assert len(pred["observations"]) > 0

def test_ml_prediction_contaminated_sample():
    # Scenario 6: Multiple severe deviations
    bad_sample = {
        "ph": 4.5,
        "turbidity": 20.0,
        "temperature": 35.0,
        "dissolved_oxygen": 2.0,
        "tds": 1500.0,
        "electrical_conductivity": 2200.0
    }
    pred = predict_water_quality(bad_sample)
    assert pred["predicted_category"] == "Potentially Contaminated"
    assert pred["severe_violations"] >= 2

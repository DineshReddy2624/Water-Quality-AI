import json
import os
import pytest

def test_manual_testing_samples_json_exists():
    path = "backend/data/manual_testing_samples.json"
    assert os.path.exists(path), f"File {path} must exist"
    with open(path, "r", encoding="utf-8") as f:
        samples = json.load(f)
    assert len(samples) == 6
    assert samples[0]["sample_id"] == "WQ001"
    assert samples[5]["sample_id"] == "WQ006"

def test_full_pipeline_all_six_scenarios(client, auth_headers):
    with open("backend/data/manual_testing_samples.json", "r", encoding="utf-8") as f:
        scenarios = json.load(f)

    for sc in scenarios:
        payload = {
            "sample_id": f"PIPE_{sc['sample_id']}",
            "water_source_name": sc["water_source_name"],
            "location_name": sc["location_name"],
            "latitude": sc["latitude"],
            "longitude": sc["longitude"],
            "timezone": sc.get("timezone", "Asia/Kolkata"),
            "collection_date": sc["collection_date"],
            "notes": sc["notes"],
            "parameters": sc["parameters"]
        }
        resp = client.post("/api/samples/", json=payload, headers=auth_headers)
        assert resp.status_code == 201, f"Failed creating {sc['sample_id']}: {resp.text}"
        data = resp.json()
        assert data["sample_id"] == f"PIPE_{sc['sample_id']}"
        assert data["analysis"] is not None
        assert "predicted_category" in data["analysis"]
        assert "wqi_score" in data["analysis"]
        assert "decision_explanation" in data["analysis"]

        # Verify scenario 1 is Good Quality
        if sc["sample_id"] == "WQ001":
            assert data["analysis"]["predicted_category"] == "Good Quality"
            assert data["analysis"]["wqi_score"] >= 80.0
            assert len(data["alerts"]) == 0

        # Verify scenario 6 is Potentially Contaminated with alerts
        if sc["sample_id"] == "WQ006":
            assert data["analysis"]["predicted_category"] == "Potentially Contaminated"
            assert len(data["alerts"]) >= 3

def test_parameter_configs_endpoint(client):
    resp = client.get("/api/analysis/parameters/config")
    assert resp.status_code == 200
    data = resp.json()
    assert "ph" in data
    assert "turbidity" in data
    assert "physical_min" in data["ph"]
    assert "standard_value" in data["ph"]

def test_versioned_analysis_history(client, auth_headers):
    # Create sample
    payload = {
        "sample_id": "HIST_TEST_01",
        "water_source_name": "History River",
        "location_name": "History Reach",
        "parameters": {
            "ph": 7.2, "turbidity": 1.5, "temperature": 25.0,
            "dissolved_oxygen": 7.8, "tds": 280.0, "electrical_conductivity": 450.0
        }
    }
    create_resp = client.post("/api/samples/", json=payload, headers=auth_headers)
    assert create_resp.status_code == 201

    # Re-analyze with random_forest
    re_resp1 = client.post("/api/analysis/HIST_TEST_01", json={"model_preference": "random_forest"})
    assert re_resp1.status_code == 200

    # Re-analyze with decision_tree
    re_resp2 = client.post("/api/analysis/HIST_TEST_01", json={"model_preference": "decision_tree"})
    assert re_resp2.status_code == 200

    # Retrieve history
    hist_resp = client.get("/api/analysis/HIST_TEST_01/history")
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["total_analyses"] >= 2
    assert len(hist_data["analyses"]) >= 2

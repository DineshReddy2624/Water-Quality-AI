def test_create_and_analyze_sample(client, auth_headers):
    # Scenario 1: Normal Sample
    sample_payload = {
        "sample_id": "TEST_WQ001",
        "water_source_name": "Test Lake Alpha",
        "location_name": "Test Location A",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "parameters": {
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
    }
    resp = client.post("/api/samples/", json=sample_payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["sample_id"] == "TEST_WQ001"
    assert data["parameters"]["ph"] == 7.2
    assert data["analysis"] is not None
    assert "Good" in data["analysis"]["predicted_category"]

def test_create_acidic_sample_generates_alerts(client, auth_headers):
    # Scenario 2: Acidic Water Sample
    sample_payload = {
        "sample_id": "TEST_WQ002",
        "water_source_name": "Industrial Test Canal",
        "location_name": "Industrial District",
        "parameters": {
            "ph": 5.2,
            "turbidity": 8.5,
            "temperature": 28.0,
            "dissolved_oxygen": 4.0,
            "tds": 650.0,
            "electrical_conductivity": 950.0
        }
    }
    resp = client.post("/api/samples/", json=sample_payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["sample_id"] == "TEST_WQ002"
    # Verify alerts generated
    assert len(data["alerts"]) > 0
    # One of the alerts should relate to pH
    alert_params = [a["abnormal_parameter"] for a in data["alerts"]]
    assert any("pH" in p for p in alert_params)

def test_parameter_range_validation(client, auth_headers):
    # Invalid pH > 14
    bad_payload = {
        "sample_id": "TEST_BAD",
        "water_source_name": "Invalid Source",
        "location_name": "Invalid Location",
        "parameters": {
            "ph": 15.5,  # Out of range 0-14
            "turbidity": 2.0,
            "temperature": 20.0,
            "dissolved_oxygen": 7.0,
            "tds": 300.0,
            "electrical_conductivity": 450.0
        }
    }
    resp = client.post("/api/samples/", json=bad_payload, headers=auth_headers)
    assert resp.status_code == 422  # Pydantic validation error

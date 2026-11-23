def test_create_and_analyze_sample(client, auth_headers):
    # Scenario 1: Normal Sample
    sample_payload = {
        "sample_id": "TEST_WQ001",
        "water_source_name": "Test Lake Alpha",
        "location_name": "Test Location A",
        "latitude": 12.9716,
        "longitude": 77.5946,
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

def test_get_next_sample_id(client):
    resp = client.get("/api/samples/next-id")
    assert resp.status_code == 200
    data = resp.json()
    assert "next_sample_id" in data
    assert data["next_sample_id"].startswith("WQ")

def test_bulk_delete_samples(client, auth_headers):
    # Create two test samples
    p1 = {
        "sample_id": "TEST_BULK_01",
        "water_source_name": "Bulk Test Lake 1",
        "location_name": "Bulk Station 1",
        "parameters": {"ph": 7.0, "turbidity": 2.0, "temperature": 25.0, "dissolved_oxygen": 7.0, "tds": 300.0, "electrical_conductivity": 450.0}
    }
    p2 = {
        "sample_id": "TEST_BULK_02",
        "water_source_name": "Bulk Test Lake 2",
        "location_name": "Bulk Station 2",
        "parameters": {"ph": 7.5, "turbidity": 1.8, "temperature": 24.0, "dissolved_oxygen": 7.5, "tds": 280.0, "electrical_conductivity": 420.0}
    }
    r1 = client.post("/api/samples/", json=p1, headers=auth_headers)
    r2 = client.post("/api/samples/", json=p2, headers=auth_headers)
    assert r1.status_code == 201
    assert r2.status_code == 201

    # Bulk delete both
    del_resp = client.post("/api/samples/bulk-delete", json={"sample_ids": ["TEST_BULK_01", "TEST_BULK_02"]})
    assert del_resp.status_code == 200
    assert del_resp.json()["deleted_count"] == 2

    # Verify both are deleted
    assert client.get("/api/samples/TEST_BULK_01").status_code == 404
    assert client.get("/api/samples/TEST_BULK_02").status_code == 404


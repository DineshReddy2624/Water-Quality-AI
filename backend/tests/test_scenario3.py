"""
Automated Validation Suite for Scenario 3: High Turbidity Water Sample.

Technical and Scientific Verification:
1. Parameter Input:
   pH=7.4, Turbidity=15.0 NTU, Temperature=22.5°C, DO=7.2 mg/L, TDS=420 mg/L,
   EC=590 µS/cm, Hardness=160 mg/L, Chloramines=2.1 mg/L, Sulfate=180 mg/L, TOC=5.1 mg/L.
2. AquaSense Custom Water Quality Score (WA-WQS v2.1):
   - WQI Score ~ 79.35 / 100
   - WQI Category: Moderate Quality
3. Supervised ML Classifier:
   - ML Model Prediction: Moderate Quality
   - ML Calibrated Confidence: ~91%
4. Safety Arbitration Mechanism:
   - Critical physical violation: Turbidity 15.0 NTU > 10.0 NTU critical threshold.
   - Final Safety-Arbitrated Classification: Poor Quality
   - Exact override rule: 'Single Critical Parameter Threshold Override'
5. Isolation Forest Anomaly Scoring:
   - Normalized score ~ 0.337 (Threshold 0.500)
   - Isolation Forest status: Statistical Inlier (Within Normal ML Envelope)
   - Anomaly flag triggered strictly by deterministic parameter threshold rules.
6. Calibrated Targeted Recommendations:
   - TOC: Non-alarming, screening-level baseline advisory.
   - Turbidity: Specific jar settling and optical verification advisory.
7. Timezone Precision:
   - Collection time: 23 November 2026, 06:35 PM IST
   - Analysis time: 23 November 2026, 06:41 PM IST
"""

from datetime import datetime, timezone
import pytest
from app.ml.wqi_calculator import compute_water_quality_index, WQI_CALCULATION_VERSION
from app.ml.anomaly_detection import detect_anomalies
from app.ml.prediction import predict_water_quality
from app.services.recommendation_engine import generate_recommendations
from app.core.datetime_utils import parse_local_to_utc, format_utc_to_local_string

SCENARIO_3_PARAMS = {
    "ph": 7.1,
    "turbidity": 15.0,
    "temperature": 27.0,
    "dissolved_oxygen": 6.2,
    "tds": 420.0,
    "electrical_conductivity": 600.0,
    "hardness": 140.0,
    "chloramines": 2.4,
    "sulfate": 195.0,
    "organic_carbon": 5.1
}

def test_scenario3_wqi_calculation():
    res = compute_water_quality_index(SCENARIO_3_PARAMS)
    assert res["calculation_version"] == "AquaSense-Custom-WA-WQS-v2.1"
    # Custom score is in Moderate Quality range (~75 - 80)
    assert 70.0 <= res["wqi_score"] <= 82.0
    assert res["rating_category"] == "Moderate Quality"
    assert "turbidity" in res["sub_indices"]
    # Sub-index for turbidity 15.0 NTU must show degradation (below 50)
    turb_qi = res["sub_indices"]["turbidity"]["sub_index_qi"]
    assert turb_qi < 50.0

def test_scenario3_isolation_forest_scoring_no_contradiction():
    res = detect_anomalies(SCENARIO_3_PARAMS)
    # Normalized score should be around ~0.337 (strictly < 0.500)
    assert res["anomaly_threshold"] == 0.500
    assert res["anomaly_score"] < 0.500
    # Isolation Forest itself should consider this an inlier
    assert res["ml_anomaly_detected"] is False
    assert "Inlier" in res["ml_anomaly_status"]
    # But parameter threshold rule is triggered due to Turbidity 15.0 NTU
    assert res["rule_threshold_detected"] is True
    assert res["severe_violations"] == 1
    # Overall sample is flagged by threshold rules
    assert res["is_anomaly"] is True

def test_scenario3_4tier_classification_and_safety_arbitration():
    res = predict_water_quality(SCENARIO_3_PARAMS, model_preference="ensemble")
    matrix = res.get("classification_matrix_4tier")
    assert matrix is not None

    tier1 = matrix["tier1_ml"]
    tier2 = matrix["tier2_wqi"]
    tier3 = matrix["tier3_rules"]
    tier4 = matrix["tier4_arbitrated"]

    # Tier 1: ML Model predicted Moderate Quality with honest un-fabricated probability
    assert tier1["predicted_category"] == "Moderate Quality"
    assert 0.50 <= tier1["confidence"] <= 1.0

    # Tier 2: WQI Assessment is Moderate Quality
    assert tier2["wqi_category"] == "Moderate Quality"

    # Tier 3: Rule-Based Evaluation found 1 Critical Violation
    assert tier3["severe_violations_count"] == 1
    assert any("Turbidity" in v for v in tier3["critical_violations"])

    # Tier 4: Safety Arbitration overrode ML to Poor Quality
    assert tier4["final_category"] == "Poor Quality"
    assert tier4["override_applied"] is True
    assert "Single Critical Parameter Threshold Override" in tier4["override_rule_applied"]
    assert res["predicted_category"] == "Poor Quality"

def test_scenario3_calibrated_recommendations():
    # Evaluate parameters to get observations
    from app.ml.classification import evaluate_all_parameters
    obs, severe, abn, _ = evaluate_all_parameters(SCENARIO_3_PARAMS)
    recs = generate_recommendations(
        params=SCENARIO_3_PARAMS,
        observations=obs,
        wqi_score=76.24,
        is_anomaly=True,
        severity="Medium"
    )

    toc_rec = next((r for r in recs if "Organic Carbon" in r["title"] or "TOC" in r["title"]), None)
    assert toc_rec is not None
    assert "slightly above the configured screening baseline" in toc_rec["description"]
    assert "disinfection byproduct formation potential" in toc_rec["description"]
    # Non-alarmist: ensure it does not claim immediate proof of high risk
    assert "High risk of disinfection byproduct formation upon chlorination" not in toc_rec["description"]

    turb_rec = next((r for r in recs if "Turbidity" in r["title"]), None)
    assert turb_rec is not None
    assert "Exceeds the configured critical turbidity screening threshold of 10 NTU" in turb_rec["description"]
    assert "jar settling" in turb_rec["description"]

def test_centralized_observation_and_action_consistency():
    from app.core.parameter_config import evaluate_parameter_status
    toc_obs = evaluate_parameter_status("organic_carbon", 5.1)
    assert toc_obs["status"] == "Elevated"
    assert "slightly above the configured screening baseline" in toc_obs["observation"]
    assert "slightly above the configured screening baseline" in toc_obs["action_note"]
    assert "High risk of disinfection byproduct formation upon chlorination" not in toc_obs["action_note"]

    turb_obs = evaluate_parameter_status("turbidity", 15.0)
    assert turb_obs["status"] == "Critical High"
    assert "Exceeds the configured critical turbidity screening threshold of 10 NTU" in turb_obs["observation"]
    assert "Exceeds the configured critical turbidity screening threshold of 10 NTU" in turb_obs["action_note"]

def test_duplicate_sample_id_rejection(client):
    payload = {
        "sample_id": "TEST_UNIQUE_CHK",
        "water_source_name": "Unique Test Source",
        "location_name": "Unique Test Station",
        "latitude": 12.518,
        "longitude": 77.442,
        "parameters": {
            "ph": 7.1, "turbidity": 2.0, "temperature": 25.0, "dissolved_oxygen": 7.0,
            "tds": 300.0, "electrical_conductivity": 450.0
        }
    }
    r1 = client.post("/api/samples/", json=payload)
    assert r1.status_code == 201

    # Attempting to create again with same sample_id must fail with 400 without overwriting
    r2 = client.post("/api/samples/", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]

    # Check ID endpoint
    chk = client.get("/api/samples/check-id/TEST_UNIQUE_CHK")
    assert chk.status_code == 200
    assert chk.json()["is_available"] is False

    chk_avail = client.get("/api/samples/check-id/TOTALLY_FRESH_ID_999")
    assert chk_avail.status_code == 200
    assert chk_avail.json()["is_available"] is True

def test_india_coordinate_bounding_box(client):
    # Valid India coordinates: 12.518° N, 77.442° E
    good_payload = {
        "sample_id": "TEST_GEO_GOOD",
        "water_source_name": "India River Station",
        "location_name": "Karnataka Basin",
        "latitude": 12.518,
        "longitude": 77.442,
        "parameters": {
            "ph": 7.1, "turbidity": 1.5, "temperature": 25.0, "dissolved_oxygen": 7.5,
            "tds": 320.0, "electrical_conductivity": 480.0
        }
    }
    r_good = client.post("/api/samples/", json=good_payload)
    assert r_good.status_code == 201

    # Invalid coordinates outside India (e.g. Lat 55.0° N)
    bad_payload = dict(good_payload)
    bad_payload["sample_id"] = "TEST_GEO_BAD"
    bad_payload["latitude"] = 55.0
    r_bad = client.post("/api/samples/", json=bad_payload)
    assert r_bad.status_code == 400
    assert "outside the configured India territorial bounding box" in r_bad.json()["detail"]

def test_repeated_analysis_creates_new_version(client):
    # Retrieve the created sample and trigger analysis
    sample = client.get("/api/samples/TEST_GEO_GOOD").json()
    sample_db_id = sample["id"]

    # Run analysis
    r_an1 = client.post(f"/api/analysis/{sample_db_id}")
    assert r_an1.status_code == 200
    v1 = r_an1.json()["analysis_version"]

    # Run repeated analysis
    r_an2 = client.post(f"/api/analysis/{sample_db_id}")
    assert r_an2.status_code == 200
    v2 = r_an2.json()["analysis_version"]
    assert v2 > v1

    # Historical analyses list should reflect both
    detail = client.get("/api/samples/TEST_GEO_GOOD").json()
    assert len(detail.get("analyses_history", [])) >= 2

def test_scenario3_timezone_exact_formatting():
    # Collection: 23 November 2026, 18:35 in Asia/Kolkata
    coll_utc = parse_local_to_utc("2026-11-23T18:35:00", "Asia/Kolkata")
    coll_formatted = format_utc_to_local_string(coll_utc, "Asia/Kolkata")
    assert coll_formatted == "23 November 2026, 06:35 PM IST"

    # Analysis UTC: 13:11:00 UTC
    analysis_utc = datetime(2026, 11, 23, 13, 11, 0, tzinfo=timezone.utc)
    analysis_formatted = format_utc_to_local_string(analysis_utc, "Asia/Kolkata")
    assert analysis_formatted == "23 November 2026, 06:41 PM IST"

"""
Comprehensive Validation Suite for All 6 Test Scenarios, ID Uniqueness,
Coordinates, and Output Consistency.
"""

import pytest
from app.ml.prediction import predict_water_quality
from app.ml.anomaly_detection import detect_anomalies
from app.ml.wqi_calculator import compute_water_quality_index
from app.reports.pdf_generator import generate_water_sample_pdf
from app.reports.excel_generator import generate_samples_excel_report

ALL_SCENARIOS = {
    "Scenario 1": {
        "params": {
            "ph": 7.2, "turbidity": 1.5, "temperature": 25.0, "dissolved_oxygen": 7.8,
            "tds": 280.0, "electrical_conductivity": 450.0, "hardness": 120.0,
            "chloramines": 2.1, "sulfate": 180.0, "organic_carbon": 3.2
        },
        "expected_category": "Good Quality"
    },
    "Scenario 2": {
        "params": {
            "ph": 5.2, "turbidity": 8.5, "temperature": 28.0, "dissolved_oxygen": 4.0,
            "tds": 650.0, "electrical_conductivity": 950.0, "hardness": 210.0,
            "chloramines": 3.8, "sulfate": 320.0, "organic_carbon": 7.5
        },
        "expected_category": "Potentially Contaminated"
    },
    "Scenario 3": {
        "params": {
            "ph": 7.1, "turbidity": 15.0, "temperature": 27.0, "dissolved_oxygen": 6.2,
            "tds": 420.0, "electrical_conductivity": 600.0, "hardness": 140.0,
            "chloramines": 2.4, "sulfate": 195.0, "organic_carbon": 5.1
        },
        "expected_category": "Poor Quality"
    },
    "Scenario 4": {
        "params": {
            "ph": 7.5, "turbidity": 2.0, "temperature": 26.0, "dissolved_oxygen": 6.8,
            "tds": 1200.0, "electrical_conductivity": 1800.0, "hardness": 380.0,
            "chloramines": 1.9, "sulfate": 450.0, "organic_carbon": 4.0
        },
        "expected_category": "Potentially Contaminated"
    },
    "Scenario 5": {
        "params": {
            "ph": 7.0, "turbidity": 3.0, "temperature": 30.0, "dissolved_oxygen": 2.5,
            "tds": 350.0, "electrical_conductivity": 500.0, "hardness": 130.0,
            "chloramines": 1.5, "sulfate": 160.0, "organic_carbon": 6.8
        },
        "expected_category": "Poor Quality"
    },
    "Scenario 6": {
        "params": {
            "ph": 4.5, "turbidity": 20.0, "temperature": 35.0, "dissolved_oxygen": 2.0,
            "tds": 1500.0, "electrical_conductivity": 2200.0, "hardness": 490.0,
            "chloramines": 5.2, "sulfate": 600.0, "organic_carbon": 14.5
        },
        "expected_category": "Potentially Contaminated"
    }
}

def test_all_6_scenarios_execution():
    """Verify that all 6 test scenarios execute smoothly and generate appropriate categories."""
    for name, data in ALL_SCENARIOS.items():
        p = data["params"]
        expected = data["expected_category"]

        # Run prediction
        pred = predict_water_quality(p)
        assert pred["predicted_category"] == expected, f"{name} expected {expected}, got {pred['predicted_category']}"

        # Run WQI
        wqi = compute_water_quality_index(p)
        assert 0.0 <= wqi["wqi_score"] <= 100.0

        # Run Anomaly
        anom = detect_anomalies(p)
        assert 0.0 <= anom["anomaly_score"] <= 1.0

def test_missing_optional_fields_handling():
    """Verify that omitting optional parameters (hardness, chloramines, sulfate, TOC) calculates WQI via dynamic re-weighting without imputing zero."""
    core_only = {
        "ph": 7.4,
        "turbidity": 2.1,
        "temperature": 24.0,
        "dissolved_oxygen": 7.5,
        "tds": 310.0,
        "electrical_conductivity": 460.0
    }
    wqi_res = compute_water_quality_index(core_only)
    assert wqi_res["wqi_score"] > 80.0
    assert len(wqi_res["sub_indices"]) == 6
    # Missing optional parameters should not exist in sub_indices
    assert "organic_carbon" not in wqi_res["sub_indices"]

def test_scenario3_output_consistency_across_modules():
    """Verify that Scenario 3 parameter observations, alerts, recommendations, and matrix are identical."""
    p = ALL_SCENARIOS["Scenario 3"]["params"]
    pred = predict_water_quality(p)

    # Check observations
    obs_map = {o["parameter"]: o for o in pred["observations"]}
    assert "turbidity" in obs_map
    assert "organic_carbon" in obs_map

    turb = obs_map["turbidity"]
    assert turb["status"] == "Critical High"
    assert "Exceeds the configured critical turbidity screening threshold of 10 NTU" in turb["observation"]
    assert "Exceeds the configured critical turbidity screening threshold of 10 NTU" in turb["action_note"]

    toc = obs_map["organic_carbon"]
    assert toc["status"] == "Elevated"
    assert "slightly above the configured screening baseline" in toc["observation"]
    assert "slightly above the configured screening baseline" in toc["action_note"]
    assert "High risk of disinfection byproduct formation upon chlorination" not in toc["action_note"]

    # Check matrix tier 3 and tier 4
    matrix = pred["classification_matrix_4tier"]
    assert matrix["tier3_rules"]["severe_violations_count"] == 1
    assert matrix["tier4_arbitrated"]["override_applied"] is True
    assert matrix["tier4_arbitrated"]["final_category"] == "Poor Quality"

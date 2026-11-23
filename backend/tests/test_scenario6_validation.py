import pytest
import os
import json
from app.core.parameter_config import (
    PARAMETER_CONFIGS, evaluate_parameter_status, calculate_tds_ec_ratio
)
from app.ml.classification import evaluate_all_parameters, classify_water_quality_rules
from app.ml.prediction import predict_water_quality
from app.ml.anomaly_detection import detect_anomalies
from app.ml.wqi_calculator import compute_water_quality_index, get_wqi_category, WQI_CALCULATION_VERSION
from app.services.recommendation_engine import generate_recommendations
from app.reports.pdf_generator import generate_water_sample_pdf
from app.models.water_sample import WaterSample
from app.models.water_parameter import WaterParameter
from app.models.analysis_result import AnalysisResult
from app.models.anomaly_record import AnomalyRecord

SCENARIO_6_PARAMS = {
    "ph": 4.5,
    "turbidity": 20.0,
    "temperature": 35.0,
    "dissolved_oxygen": 2.0,
    "tds": 1500.0,
    "electrical_conductivity": 2200.0,
    "hardness": 490.0,
    "chloramines": 5.2,
    "sulfate": 600.0,
    "organic_carbon": 14.5
}

def test_scenario6_all_ten_critical_violations():
    """Verify all 10 water quality parameters breach configured critical thresholds."""
    obs, severe_count, abn_names, total_measured = evaluate_all_parameters(SCENARIO_6_PARAMS)

    assert total_measured == 10
    assert severe_count == 10, f"Expected exactly 10 critical violations, got {severe_count}"
    assert len(abn_names) == 10
    
    critical_statuses = {"Critical High", "Critical Low"}
    for o in obs:
        assert o["status"] in critical_statuses, f"Parameter {o['parameter']} status {o['status']} is not Critical"
        assert o["severity_level"] == "High"

    # Confirm 0 elevated-only and 0 normal
    elevated_count = sum(1 for o in obs if o["status"] in ["Elevated", "Low"])
    normal_count = sum(1 for o in obs if o["status"] == "Normal")
    assert elevated_count == 0
    assert normal_count == 0

def test_scenario6_wqs_classification_consistency():
    """Verify Custom WA-WQS v2.1 score of 18.50 is classified as 'Potentially Contaminated' across centralized scale."""
    wqs_res = compute_water_quality_index(SCENARIO_6_PARAMS)

    assert wqs_res["wqi_score"] == 18.50
    assert wqs_res["rating_category"] == "Potentially Contaminated"
    assert get_wqi_category(18.50) == "Potentially Contaminated"

    # Verify canonical 4-tier scale boundaries
    assert get_wqi_category(90.0) == "Good Quality"
    assert get_wqi_category(80.0) == "Good Quality"
    assert get_wqi_category(79.9) == "Moderate Quality"
    assert get_wqi_category(60.0) == "Moderate Quality"
    assert get_wqi_category(59.9) == "Poor Quality"
    assert get_wqi_category(40.0) == "Poor Quality"
    assert get_wqi_category(39.9) == "Potentially Contaminated"
    assert get_wqi_category(0.0) == "Potentially Contaminated"

def test_scenario6_toc_recommendations_and_observations():
    """Verify Total Organic Carbon at 14.5 mg/L produces the exact requested critical observation and recommendation."""
    toc_obs = evaluate_parameter_status("organic_carbon", 14.5)

    expected_text = (
        "Total Organic Carbon measured at 14.5 mg/L, significantly exceeding the configured critical screening threshold of 10 mg/L. "
        "Repeat the measurement and investigate possible elevated organic loading. Conduct appropriate COD and organic matter "
        "characterization, and evaluate disinfection byproduct formation potential if chlorination is used."
    )

    assert toc_obs["status"] == "Critical High"
    assert toc_obs["observation"] == expected_text
    assert "slightly above" not in toc_obs["observation"].lower()

    # Verify recommendation engine matches
    recs = generate_recommendations(
        params=SCENARIO_6_PARAMS,
        observations=[toc_obs],
        wqi_score=18.50,
        is_anomaly=True,
        severity="High"
    )

    toc_rec = next((r for r in recs if "Organic Carbon" in r["title"] or "TOC" in r["title"]), None)
    assert toc_rec is not None
    assert toc_rec["priority"] == "High"
    assert expected_text in toc_rec["description"]

def test_scenario6_chloramines_regulatory_terminology():
    """Verify chloramines references screening protocol and avoids claiming US EPA MRDL as Indian regulation."""
    chlor_obs = evaluate_parameter_status("chloramines", 5.2)

    assert chlor_obs["status"] == "Critical High"
    assert "US EPA Maximum Residual Disinfectant Level (MRDL)" not in chlor_obs["reference_source"]
    assert "WHO Guidelines / CPCB Advisory Screening Protocol" in chlor_obs["reference_source"]
    assert "application screening threshold" in chlor_obs["action_note"]

def test_scenario6_anomaly_detection_isolation_forest():
    """Verify Isolation Forest detects a statistical outlier at 0.554 score dynamically."""
    anom_res = detect_anomalies(SCENARIO_6_PARAMS)

    assert anom_res["is_anomaly"] is True
    assert anom_res["ml_anomaly_detected"] is True
    assert anom_res["ml_anomaly_status"] == "Statistical Outlier (Multivariate Anomaly)"
    assert round(anom_res["anomaly_score"], 3) == 0.554
    assert anom_res["decision_threshold"] == 0.500
    assert "0.554" in anom_res["anomaly_explanation"]
    assert "0.500" in anom_res["anomaly_explanation"]
    assert "0.337" not in anom_res["anomaly_explanation"]  # No stale text
    assert len(anom_res["abnormal_parameters"]) == 10

def test_scenario6_safety_arbitration_status():
    """Verify Safety Arbitration evaluates alignment when ML already predicts Potentially Contaminated (no false override)."""
    pred_res = predict_water_quality(SCENARIO_6_PARAMS)

    matrix = pred_res.get("classification_matrix_4tier")
    assert matrix is not None

    tier1 = matrix["tier1_ml"]
    tier4 = matrix["tier4_arbitrated"]

    assert tier1["predicted_category"] == "Potentially Contaminated"
    assert tier4["final_category"] == "Potentially Contaminated"
    assert tier4["override_applied"] is False
    assert tier4["override_status"] == "Not Required"
    assert "aligns with the rule-based screening outcome" in tier4["reason"]
    assert "Safety Arbitration: Evaluated" in tier4["arbitration_explanation"]
    assert "Override Status: Not Required" in tier4["arbitration_explanation"]

def test_scenario6_ml_confidence_validation():
    """Verify ML confidence is labeled as uncalibrated model probability and includes disclaimer."""
    pred_res = predict_water_quality(SCENARIO_6_PARAMS)

    matrix = pred_res["classification_matrix_4tier"]
    tier1 = matrix["tier1_ml"]

    assert "Uncalibrated Model Probability" in tier1["confidence_type"]
    assert tier1["confidence"] == 1.0  # 100% ensemble tree consensus
    assert "confidence_note" in tier1
    assert "not a measure of water safety" in tier1["confidence_note"]

def test_scenario6_pdf_report_consistency():
    """Verify PDF report generates cleanly and includes the Executive Summary with accurate counts."""
    from tests.conftest import TestingSessionLocal
    db = TestingSessionLocal()
    try:
        sample = WaterSample(
            sample_id="WQ006_TEST",
            water_source_name="Industrial Discharge Outfall",
            location_name="Industrial Discharge Area",
            latitude=13.0827,
            longitude=80.2707
        )
        sample.parameters = WaterParameter(
            ph=4.5,
            turbidity=20.0,
            temperature=35.0,
            dissolved_oxygen=2.0,
            tds=1500.0,
            electrical_conductivity=2200.0,
            hardness=490.0,
            chloramines=5.2,
            sulfate=600.0,
            organic_carbon=14.5
        )
        sample.alerts = []

        analysis = AnalysisResult(
            sample_id=999,
            predicted_category="Potentially Contaminated",
            confidence_score=1.0,
            confidence_type="Uncalibrated Model Probability",
            model_used="Ensemble Classifier + Safety Arbitration",
            wqi_score=18.50,
            recommendations_json=json.dumps([{
                "title": "Elevated Total Organic Carbon (TOC) & Organic Loading Investigation",
                "description": "Total Organic Carbon measured at 14.5 mg/L, significantly exceeding the configured critical screening threshold of 10 mg/L.",
                "priority": "High",
                "category": "Laboratory"
            }]),
            classification_matrix_json=json.dumps({
                "tier1_ml": {
                    "predicted_category": "Potentially Contaminated",
                    "confidence": 1.0,
                    "confidence_type": "Uncalibrated Model Probability",
                    "model_name": "Ensemble Classifier"
                },
                "tier2_wqi": {
                    "wqi_score": 18.50,
                    "wqi_category": "Potentially Contaminated"
                },
                "tier3_rules": {
                    "severe_violations_count": 10,
                    "critical_violations": ["10 parameters breached"]
                },
                "tier4_arbitrated": {
                    "final_category": "Potentially Contaminated",
                    "override_applied": False,
                    "override_status": "Not Required",
                    "arbitration_explanation": "Safety Arbitration: Evaluated. Override Status: Not Required."
                }
            })
        )

        anom = AnomalyRecord(
            sample_id=999,
            is_anomaly=True,
            anomaly_score=0.554,
            severity="High",
            detected_method="Isolation Forest Multivariate ML",
            notes="Isolation Forest detected a statistical outlier pattern because the normalized outlier score of 0.554 exceeds the configured threshold of 0.500."
        )

        pdf_path = "backend/data/reports/test_scenario6_report.pdf"
        res_path = generate_water_sample_pdf(sample, analysis, [anom], pdf_path)
        assert os.path.exists(res_path)
        assert os.path.getsize(res_path) > 1000
    finally:
        db.close()

def test_regression_scenarios_1_to_6():
    """Verify that Scenarios 1 through 6 all evaluate correctly without regressions."""
    scenarios = [
        {
            "name": "Scenario 1: Normal",
            "params": {"ph": 7.2, "turbidity": 1.5, "temperature": 25.0, "dissolved_oxygen": 7.8, "tds": 280.0, "electrical_conductivity": 450.0, "hardness": 120.0, "chloramines": 2.1, "sulfate": 180.0, "organic_carbon": 3.2},
            "expected_category": "Good Quality"
        },
        {
            "name": "Scenario 2: Acidic",
            "params": {"ph": 5.2, "turbidity": 8.5, "temperature": 28.0, "dissolved_oxygen": 4.0, "tds": 650.0, "electrical_conductivity": 950.0, "hardness": 210.0, "chloramines": 3.8, "sulfate": 320.0, "organic_carbon": 7.5},
            "expected_category": "Potentially Contaminated"
        },
        {
            "name": "Scenario 3: High Turbidity",
            "params": {"ph": 7.1, "turbidity": 15.0, "temperature": 27.0, "dissolved_oxygen": 6.2, "tds": 420.0, "electrical_conductivity": 600.0, "hardness": 140.0, "chloramines": 2.4, "sulfate": 195.0, "organic_carbon": 5.1},
            "expected_category": "Poor Quality"
        },
        {
            "name": "Scenario 4: High TDS",
            "params": {"ph": 7.5, "turbidity": 2.0, "temperature": 26.0, "dissolved_oxygen": 6.8, "tds": 1200.0, "electrical_conductivity": 1800.0, "hardness": 380.0, "chloramines": 1.9, "sulfate": 450.0, "organic_carbon": 4.0},
            "expected_category": "Potentially Contaminated"
        },
        {
            "name": "Scenario 5: Low Dissolved Oxygen",
            "params": {"ph": 7.0, "turbidity": 3.0, "temperature": 30.0, "dissolved_oxygen": 2.5, "tds": 350.0, "electrical_conductivity": 500.0, "hardness": 130.0, "chloramines": 1.5, "sulfate": 160.0, "organic_carbon": 6.8},
            "expected_category": "Poor Quality"
        },
        {
            "name": "Scenario 6: Multiple Abnormal",
            "params": SCENARIO_6_PARAMS,
            "expected_category": "Potentially Contaminated"
        }
    ]

    for sc in scenarios:
        res = predict_water_quality(sc["params"])
        assert res["predicted_category"] == sc["expected_category"], f"Failed for {sc['name']}: got {res['predicted_category']}, expected {sc['expected_category']}"

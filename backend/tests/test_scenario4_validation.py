import pytest
import os
import json
from app.core.parameter_config import (
    PARAMETER_CONFIGS, evaluate_parameter_status, calculate_tds_ec_ratio
)
from app.ml.classification import evaluate_all_parameters, classify_water_quality_rules
from app.ml.prediction import predict_water_quality
from app.ml.anomaly_detection import detect_anomalies
from app.ml.wqi_calculator import compute_water_quality_index, WQI_CALCULATION_VERSION
from app.services.recommendation_engine import generate_recommendations
from app.reports.pdf_generator import generate_water_sample_pdf
from app.models.water_sample import WaterSample
from app.models.water_parameter import WaterParameter
from app.models.analysis_result import AnalysisResult
from app.models.anomaly_record import AnomalyRecord

SCENARIO_4_PARAMS = {
    "ph": 7.5,
    "turbidity": 2.0,
    "temperature": 26.0,
    "dissolved_oxygen": 6.8,
    "tds": 1200.0,
    "electrical_conductivity": 1800.0,
    "hardness": 380.0,
    "chloramines": 1.9,
    "sulfate": 450.0,
    "organic_carbon": 4.0
}

def test_scenario4_severity_and_critical_breach_count():
    """Verify all 4 mineral parameters breach critical thresholds and count is exactly 4."""
    obs, severe_count, abn_names, total_measured = evaluate_all_parameters(SCENARIO_4_PARAMS)
    
    assert total_measured == 10
    assert severe_count == 4, f"Expected 4 critical breaches, got {severe_count}"
    assert set(abn_names) == {"tds", "electrical_conductivity", "hardness", "sulfate"}
    
    status_map = {o["parameter"]: o["status"] for o in obs}
    assert status_map["tds"] == "Critical High"
    assert status_map["electrical_conductivity"] == "Critical High"
    assert status_map["hardness"] == "Critical High"
    assert status_map["sulfate"] == "Critical High"
    assert status_map["ph"] == "Normal"
    assert status_map["turbidity"] == "Normal"
    assert status_map["dissolved_oxygen"] == "Normal"

def test_scenario4_parameter_specific_explanations():
    """Verify TDS and all parameters generate distinct, parameter-specific explanations."""
    tds_obs = evaluate_parameter_status("tds", 1200.0)
    ec_obs = evaluate_parameter_status("electrical_conductivity", 1800.0)
    hardness_obs = evaluate_parameter_status("hardness", 380.0)
    sulfate_obs = evaluate_parameter_status("sulfate", 450.0)
    
    # Check exact expected explanation for TDS
    expected_tds_text = "Total Dissolved Solids measured at 1200 mg/L, exceeding the configured critical TDS screening threshold of 1000 mg/L."
    assert tds_obs["observation"] == expected_tds_text
    assert "turbidity" not in tds_obs["observation"].lower()
    
    # Check EC explanation
    assert "1800 µS/cm" in ec_obs["observation"]
    assert "1500" in ec_obs["observation"]
    assert "EC" in ec_obs["observation"]
    
    # Check Hardness explanation
    assert "380 mg/L" in hardness_obs["observation"]
    assert "350" in hardness_obs["observation"]
    assert "hardness" in hardness_obs["observation"].lower()
    
    # Check Sulfate explanation
    assert "450 mg/L" in sulfate_obs["observation"]
    assert "400" in sulfate_obs["observation"]
    assert "sulfate" in sulfate_obs["observation"].lower()

def test_scenario4_tds_ec_ratio():
    """Verify empirical TDS/EC ratio calculation and range validation."""
    ratio_res = calculate_tds_ec_ratio(1200.0, 1800.0)
    assert ratio_res is not None
    assert ratio_res["calculated_ratio"] == 0.667
    assert ratio_res["expected_range_min"] == 0.55
    assert ratio_res["expected_range_max"] == 0.70
    assert ratio_res["is_within_range"] is True
    assert ratio_res["ratio_status"] == "Within Expected Range"
    assert "cannot establish instrument calibration accuracy" in ratio_res["scientific_disclaimer"]

def test_scenario4_wqs_option_a_formula():
    """Verify Custom WA-WQS v2.1 follows Option A positive direction and weights sum to 1.0."""
    wqs_res = compute_water_quality_index(SCENARIO_4_PARAMS)
    
    assert wqs_res["calculation_version"] == "AquaSense-Custom-WA-WQS-v2.1"
    assert "Option A Positive Polarity" in wqs_res["methodology"]
    assert abs(wqs_res["mathematical_summary"]["weights_sum"] - 1.0) < 0.01
    
    # Verify sub-index direction: high = clean, low = degraded
    subs = wqs_res["sub_indices"]
    assert subs["ph"]["sub_index_qi"] > 90.0  # pH 7.5 is optimal
    assert subs["turbidity"]["sub_index_qi"] > 90.0  # Turbidity 2.0 is optimal
    assert subs["tds"]["sub_index_qi"] < 50.0  # TDS 1200 is degraded
    assert subs["electrical_conductivity"]["sub_index_qi"] < 50.0  # EC 1800 is degraded

def test_scenario4_anomaly_detection_consistency():
    """Verify dynamic anomaly explanation matches normalized score and status without stale text."""
    anom = detect_anomalies(SCENARIO_4_PARAMS)
    
    norm_score = anom["anomaly_score"]
    assert isinstance(norm_score, float)
    
    # Anomaly explanation must be dynamically generated
    if anom["ml_anomaly_detected"]:
        assert "statistical outlier pattern" in anom["notes"]
        assert f"score of {norm_score:.3f} exceeds" in anom["notes"]
        assert "0.337" not in anom["notes"]
    else:
        assert "statistical inlier pattern" in anom["notes"]
        assert f"score of {norm_score:.3f} is within" in anom["notes"]

def test_scenario4_safety_arbitration_4tier():
    """Verify 4-Tier classification and safety override to Potentially Contaminated."""
    pred = predict_water_quality(SCENARIO_4_PARAMS, model_preference="ensemble")
    
    matrix = pred["classification_matrix_4tier"]
    assert matrix["tier1_ml"]["predicted_category"] is not None
    assert matrix["tier2_wqi"]["wqi_score"] > 0
    assert matrix["tier3_rules"]["severe_violations_count"] == 4
    
    # Tier 4 Safety Arbitration
    t4 = matrix["tier4_arbitrated"]
    assert t4["final_category"] == "Potentially Contaminated"
    assert t4["override_applied"] is True
    assert "Multi-Parameter Critical Contamination Safety Override" in t4["override_rule_applied"]
    assert "4 critical parameter threshold breach(es)" in t4["arbitration_explanation"]
    assert "environmental screening classification" in t4["arbitration_explanation"].lower()

def test_scenario4_alerts_and_recommendations():
    """Verify parameter-specific alerts and targeted recommendations for all 4 critical parameters."""
    obs, severe_count, abn_names, _ = evaluate_all_parameters(SCENARIO_4_PARAMS)
    recs = generate_recommendations(
        SCENARIO_4_PARAMS, obs, wqi_score=89.91, is_anomaly=True, severity="High"
    )
    
    rec_titles = [r["title"] for r in recs]
    # Verify parameter-specific recommendations exist
    assert any("Total Dissolved Solids" in t for t in rec_titles)
    assert any("Electrical Conductivity" in t for t in rec_titles)
    assert any("Total Hardness" in t for t in rec_titles)
    assert any("Sulfate" in t for t in rec_titles)
    assert any("Accredited Laboratory" in t for t in rec_titles)

def test_scenario4_pdf_report_consistency(tmp_path):
    """Verify PDF report table displays 'Critical High' for all 4 parameters and includes TDS/EC ratio."""
    from tests.conftest import TestingSessionLocal
    db_session = TestingSessionLocal()
    try:
        # Create sample in test DB
        sample = WaterSample(
            sample_id="WQ004-TEST",
            water_source_name="Groundwater Aquifer 4",
            location_name="Groundwater Zone",
            latitude=12.9250,
            longitude=77.5930
        )
        db_session.add(sample)
        db_session.flush()
        
        param = WaterParameter(
            sample_id=sample.id,
            ph=7.5,
            turbidity=2.0,
            temperature=26.0,
            dissolved_oxygen=6.8,
            tds=1200.0,
            electrical_conductivity=1800.0,
            hardness=380.0,
            chloramines=1.9,
            sulfate=450.0,
            organic_carbon=4.0
        )
        db_session.add(param)
        db_session.commit()
        
        from app.services.analysis_service import run_full_sample_analysis
        res = run_full_sample_analysis(sample.id, db_session)
        
        out_pdf = str(tmp_path / "scenario4_report.pdf")
        pdf_path = generate_water_sample_pdf(sample, out_pdf, analysis=res["analysis"], anomalies=[res["anomaly"]])
        assert os.path.exists(pdf_path)
        assert os.path.getsize(pdf_path) > 1000
    finally:
        db_session.close()

import pytest
import os
import json
import openpyxl
from pypdf import PdfReader
from app.core.parameter_config import PARAMETER_CONFIGS
from app.ml.wqi_calculator import compute_water_quality_index, get_wqi_category
from app.reports.pdf_generator import generate_water_sample_pdf
from app.reports.excel_generator import generate_single_sample_excel_report
from app.models.water_sample import WaterSample
from app.models.water_parameter import WaterParameter
from app.models.analysis_result import AnalysisResult

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

CLEAN_SAMPLE_PARAMS = {
    "ph": 7.2,
    "turbidity": 1.5,
    "temperature": 22.0,
    "dissolved_oxygen": 8.5,
    "tds": 240.0,
    "electrical_conductivity": 380.0,
    "hardness": 120.0,
    "chloramines": 1.0,
    "sulfate": 80.0,
    "organic_carbon": 2.1
}

def create_mock_objects(sample_id, source_name, params_dict, wqi_score, predicted_cat, anomaly_score):
    sample = WaterSample(
        id=999 if sample_id == "WQ004" else 888,
        sample_id=sample_id,
        water_source_name=source_name,
        location_name="Peenya Industrial Area" if "Industrial" in source_name else "Sample Lake A, Station 1",
        latitude=13.0285,
        longitude=77.5195,
        timezone="Asia/Kolkata"
    )
    p = WaterParameter(id=sample.id, sample_id=sample.id, **params_dict)
    sample.parameters = p

    analysis = AnalysisResult(
        id=401 if sample_id == "WQ004" else 501,
        sample_id=sample.id,
        predicted_category=predicted_cat,
        confidence_score=1.0 if sample_id == "WQ004" else 0.95,
        confidence_type="ML Model Voting Consensus",
        wqi_score=wqi_score,
        anomaly_score=anomaly_score,
        is_anomaly=anomaly_score >= 0.500,
        model_used="Supervised Tree Ensemble Classifier (Random Forest + XGBoost)",
        decision_steps_json="[]",
        recommendations_json="[]",
        classification_matrix_json=json.dumps({
            "tier1_ml": {"predicted_category": predicted_cat, "confidence": 1.0 if sample_id == "WQ004" else 0.95},
            "tier2_wqi": {"wqi_score": wqi_score, "wqi_category": predicted_cat},
            "tier3_rules": {"severe_violations_count": 10 if sample_id == "WQ004" else 0},
            "tier4_arbitrated": {
                "final_category": predicted_cat,
                "override_applied": False,
                "arbitration_explanation": "Deterministic screening matches ML prediction."
            }
        })
    )
    analysis.safety_override_applied = False
    sample.analysis = analysis
    sample.alerts = []
    sample.recommendations = []
    sample.anomalies = []
    return sample, analysis

def test_pdf_report_formula_classification_and_cards():
    sample_wq4, analysis_wq4 = create_mock_objects(
        "WQ004", "Industrial Discharge Outfall", SCENARIO_6_PARAMS, 18.50, "Potentially Contaminated", 0.554
    )
    pdf_path = "backend/tests/test_output_wq004_formulas.pdf"
    res_path = generate_water_sample_pdf(sample_wq4, analysis_wq4, pdf_path)
    assert os.path.exists(res_path)

    reader = PdfReader(res_path)
    full_text = "\n".join([page.extract_text() or "" for page in reader.pages])

    # 1. Section F exists
    assert "SECTION F" in full_text
    assert "FORMULA CLASSIFICATION AND STEP-BY-STEP CALCULATIONS" in full_text

    # 2. Categories A, B, C, D, E are present
    assert "CATEGORY A — MATHEMATICAL FORMULAS" in full_text or "CATEGORY A" in full_text
    assert "CATEGORY B — PARAMETER THRESHOLD CALCULATIONS" in full_text or "CATEGORY B" in full_text
    assert "CATEGORY C — MACHINE LEARNING PREDICTIONS" in full_text or "CATEGORY C" in full_text
    assert "CATEGORY D — ANOMALY DETECTION" in full_text or "CATEGORY D" in full_text
    assert "CATEGORY E — FINAL DECISION AND SAFETY ARBITRATION" in full_text or "CATEGORY E" in full_text

    # 3. Formula Cards F-01 through F-06 are present
    assert "[F-01]" in full_text
    assert "TDS / Electrical Conductivity Ratio" in full_text
    assert "[F-02]" in full_text
    assert "Proportionality Constant (K)" in full_text
    assert "[F-03]" in full_text
    assert "Dynamic Unit Weight Normalization (W_i)" in full_text
    assert "[F-04]" in full_text
    assert "Parameter Quality Rating Sub-Index (q_i)" in full_text
    assert "[F-05]" in full_text
    assert "Parameter Weighted Score Contribution (C_i)" in full_text
    assert "[F-06]" in full_text
    assert "Final AquaSense Water Quality Score (WQS) Aggregation" in full_text

    # 4. Step-by-Step WQS Table and substitutions
    assert "18.50" in full_text
    assert "0.682" in full_text
    assert "0.9804" in full_text

    # 5. Clean up
    if os.path.exists(res_path):
        os.remove(res_path)

def test_excel_report_sheet3_formula_classification():
    sample_wq4, analysis_wq4 = create_mock_objects(
        "WQ004", "Industrial Discharge Outfall", SCENARIO_6_PARAMS, 18.50, "Potentially Contaminated", 0.554
    )
    excel_path = "backend/tests/test_output_wq004_formulas.xlsx"
    res_path = generate_single_sample_excel_report(sample_wq4, analysis_wq4, excel_path)
    assert os.path.exists(res_path)

    wb = openpyxl.load_workbook(res_path)
    assert "Decision & Calculations" in wb.sheetnames
    ws3 = wb["Decision & Calculations"]

    sheet_text = "\n".join([" ".join([str(c.value or "") for c in row]) for row in ws3.rows])

    # Check 5 Categories
    assert "CATEGORY A - MATHEMATICAL FORMULAS" in sheet_text
    assert "CATEGORY B - PARAMETER THRESHOLD CALCULATIONS" in sheet_text
    assert "CATEGORY C - MACHINE LEARNING PREDICTIONS" in sheet_text
    assert "CATEGORY D - ANOMALY DETECTION (ISOLATION FOREST)" in sheet_text
    assert "CATEGORY E - FINAL DECISION AND SAFETY ARBITRATION" in sheet_text

    # Check Formula IDs F-01 to F-06
    assert "[F-01] TDS / Electrical Conductivity Ratio" in sheet_text
    assert "[F-02] Proportionality Constant (K)" in sheet_text
    assert "[F-03] Dynamic Unit Weight Normalization (W_i)" in sheet_text
    assert "[F-04] Parameter Quality Rating Sub-Index (q_i)" in sheet_text
    assert "[F-05] Parameter Weighted Score Contribution (C_i)" in sheet_text
    assert "[F-06] Final AquaSense Water Quality Score (WQS) Aggregation" in sheet_text

    # Check calculation values
    assert "0.682" in sheet_text
    assert "0.9804" in sheet_text
    assert "18.50" in sheet_text

    if os.path.exists(res_path):
        os.remove(res_path)

def test_single_sample_data_leakage_isolation():
    """Verify clean Sample Lake A does NOT leak WQ004 readings or industrial phrasing."""
    sample_clean, analysis_clean = create_mock_objects(
        "WQ005", "Sample Lake A", CLEAN_SAMPLE_PARAMS, 94.20, "Good Quality", 0.217
    )
    pdf_path = "backend/tests/test_output_clean_lake_isolation.pdf"
    res_path = generate_water_sample_pdf(sample_clean, analysis_clean, pdf_path)
    assert os.path.exists(res_path)

    reader = PdfReader(res_path)
    full_text = "\n".join([page.extract_text() or "" for page in reader.pages])

    # Verify Lake A specific data
    assert "Sample Lake A" in full_text
    assert "WQ005" in full_text
    assert "94.20" in full_text

    # Assert NO leakage from WQ004
    assert "Industrial Discharge Outfall" not in full_text
    assert "pH 4.5" not in full_text and "pH (4.50)" not in full_text
    assert "TOC = 14.5" not in full_text and "14.5 mg/L" not in full_text
    assert "TDS = 1500" not in full_text and "1500.0 mg/L" not in full_text
    assert "Sulfate = 600" not in full_text and "600.0 mg/L" not in full_text
    assert "Turbidity = 20.0" not in full_text and "20.0 NTU" not in full_text

    # Verify Anomaly Status is Inlier
    assert "Statistical Inlier" in full_text
    assert "0.217" in full_text

    if os.path.exists(res_path):
        os.remove(res_path)

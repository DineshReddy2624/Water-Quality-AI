import pytest
from app.core.parameter_config import (
    PARAMETER_CONFIGS, validate_parameter_value, evaluate_parameter_status,
    CORE_PARAMETERS, OPTIONAL_PARAMETERS
)

def test_valid_physical_parameters():
    is_valid, err, val = validate_parameter_value("ph", 7.2)
    assert is_valid is True
    assert err is None
    assert val == 7.2

def test_invalid_physical_parameters():
    # pH below 0 is physically invalid
    is_valid, err, _ = validate_parameter_value("ph", -1.0)
    assert is_valid is False
    assert "physically invalid" in err

    # pH above 14 is physically invalid
    is_valid, err, _ = validate_parameter_value("ph", 15.5)
    assert is_valid is False
    assert "physically invalid" in err

    # Turbidity negative is invalid
    is_valid, err, _ = validate_parameter_value("turbidity", -5.0)
    assert is_valid is False

def test_optional_parameters_handling():
    # Optional parameters can be None or empty
    is_valid, err, val = validate_parameter_value("hardness", None)
    assert is_valid is True
    assert val is None

    is_valid, err, val = validate_parameter_value("chloramines", "")
    assert is_valid is True
    assert val is None

def test_core_parameter_missing_fails():
    is_valid, err, _ = validate_parameter_value("ph", None)
    assert is_valid is False
    assert "required core measurement" in err

def test_screening_baseline_evaluations():
    # Normal pH
    eval_norm = evaluate_parameter_status("ph", 7.2)
    assert eval_norm["status"] == "Normal"
    assert eval_norm["severity_level"] == "Normal"

    # Acidic pH 5.2 (Critical Low since tolerable_min is 6.0)
    eval_acidic = evaluate_parameter_status("ph", 5.2)
    assert eval_acidic["status"] == "Critical Low"
    assert eval_acidic["severity_level"] == "High"

    # Elevated turbidity 8.5 NTU (Elevated, between optimal 5.0 and tolerable 10.0)
    eval_turb = evaluate_parameter_status("turbidity", 8.5)
    assert eval_turb["status"] == "Elevated"
    assert eval_turb["severity_level"] == "Medium"

    # Extreme turbidity 15.0 NTU (Critical High, > tolerable 10.0)
    eval_turb_crit = evaluate_parameter_status("turbidity", 15.0)
    assert eval_turb_crit["status"] == "Critical High"
    assert eval_turb_crit["severity_level"] == "High"

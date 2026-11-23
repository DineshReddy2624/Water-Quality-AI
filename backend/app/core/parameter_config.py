"""
Centralized Water Quality Parameter Configuration Module.

Provides physical instrumental limits, screening baselines, reference standards,
and evaluation functions for physical and chemical water quality parameters.

Notice: This platform is an educational screening and decision-support system.
Configured screening baselines are illustrative guidelines and do not constitute
official regulatory or laboratory certification.
"""

from typing import Dict, Any, Optional, Tuple, List

PARAMETER_CONFIGS: Dict[str, Dict[str, Any]] = {
    "ph": {
        "name": "pH Level",
        "unit": "pH units",
        "physical_min": 0.0,
        "physical_max": 14.0,
        "optimal_min": 6.5,
        "optimal_max": 8.5,
        "tolerable_min": 6.0,
        "tolerable_max": 9.0,
        "standard_value": 8.5,
        "ideal_value": 7.0,
        "wqi_unit_weight": 0.2190,  # Proportional to 1/Si
        "reference_source": "IS 10500:2012 / WHO Guidelines (4th Ed)",
        "reference_organization": "Bureau of Indian Standards (BIS) / WHO",
        "exact_standard_document": "IS 10500:2012 Drinking Water Specification (Table 1, Item 1)",
        "publication_year": "2012",
        "water_use_category": "Drinking Water & Aquatic Habitat Screening",
        "geographic_jurisdiction": "India (National) / International Guidelines",
        "threshold_source_type": "Official Standard",
        "verification_status": "Verified Standard Baseline",
        "is_core": True,
        "description": "Logarithmic measure of hydrogen ion activity; indicates acidity (<6.5) or basicity (>8.5).",
        "low_concern_action": "Acidic condition detected. Investigate potential acidic industrial discharge or acid drainage sources. Calibrate electrode and perform duplicate laboratory re-test.",
        "high_concern_action": "Alkaline condition detected. Investigate agricultural alkaline runoff, photosynthetic bloom activity, or caustic industrial outfalls."
    },
    "turbidity": {
        "name": "Turbidity",
        "unit": "NTU",
        "physical_min": 0.0,
        "physical_max": 2000.0,
        "optimal_min": 0.0,
        "optimal_max": 5.0,
        "tolerable_min": 0.0,
        "tolerable_max": 10.0,
        "standard_value": 5.0,
        "ideal_value": 0.0,
        "wqi_unit_weight": 0.3723,
        "reference_source": "CPCB Water Quality Screening Protocol / IS 10500:2012",
        "reference_organization": "Central Pollution Control Board (CPCB) / BIS",
        "exact_standard_document": "CPCB Guidelines for Water Quality Monitoring & IS 10500:2012 (Table 1, Item 3)",
        "publication_year": "2012",
        "water_use_category": "Clarity & Suspended Particulate Screening",
        "geographic_jurisdiction": "India (National)",
        "threshold_source_type": "Application-Configured Screening Protocol",
        "verification_status": "Verified Application Baseline",
        "is_core": True,
        "description": "Optical clarity measurement reflecting light scattering by suspended particles. Configured screening ranges: Optimal baseline: 0–5 NTU; Elevated range: Above 5 NTU; Configured critical range: Above 10 NTU. These are application screening configurations and must not be represented as universally applicable regulatory limits.",
        "low_concern_action": "Clear optical clarity within optimal baseline (0.0 - 5.0 NTU). Maintain routine monitoring.",
        "high_concern_action": "Conduct jar settling tests to characterize suspended particulate behavior, inspect upstream erosion/soil disturbance, and verify nephelometric optical sensor calibration."
    },
    "temperature": {
        "name": "Water Temperature",
        "unit": "°C",
        "physical_min": -5.0,
        "physical_max": 65.0,
        "optimal_min": 15.0,
        "optimal_max": 28.0,
        "tolerable_min": 10.0,
        "tolerable_max": 32.0,
        "standard_value": 25.0,
        "ideal_value": 20.0,
        "wqi_unit_weight": 0.0745,
        "reference_source": "CPCB Ambient Water Quality Criteria & EPA Aquatic Life Guidelines",
        "reference_organization": "CPCB / US EPA",
        "exact_standard_document": "CPCB Environmental Standards for Ambient Water Quality & EPA-822-R-02-047",
        "publication_year": "2002",
        "water_use_category": "Thermal & Ecological Profile",
        "geographic_jurisdiction": "India / International",
        "threshold_source_type": "Application-Configured Screening Protocol",
        "verification_status": "Verified Application Baseline",
        "is_core": True,
        "description": "Thermal state governing dissolved gas solubility, microbial metabolic kinetics, and chemical equilibria.",
        "low_concern_action": "Low temperature. Note reduced biological activity and slower chemical reaction rates.",
        "high_concern_action": "Evaluate potential thermal discharge sources or unshaded stagnant holding conditions affecting dissolved gas solubility."
    },
    "dissolved_oxygen": {
        "name": "Dissolved Oxygen (DO)",
        "unit": "mg/L",
        "physical_min": 0.0,
        "physical_max": 25.0,
        "optimal_min": 6.0,
        "optimal_max": 14.0,
        "tolerable_min": 4.5,
        "tolerable_max": 16.0,
        "standard_value": 5.0,
        "ideal_value": 14.6,  # Saturated DO at standard conditions
        "wqi_unit_weight": 0.3723,
        "reference_source": "CPCB Designated Best Use Surface Water Classification (Class C: DO >= 4.0 mg/L)",
        "reference_organization": "Central Pollution Control Board (CPCB)",
        "exact_standard_document": "CPCB Designated Best Use Classification of Inland Waters, Criteria C & D",
        "publication_year": "2008",
        "water_use_category": "Freshwater Aerobic Ecology & Biodegradation Screening",
        "geographic_jurisdiction": "India (National)",
        "threshold_source_type": "Official Standard",
        "verification_status": "Verified Standard Baseline",
        "is_core": True,
        "description": "Molecular oxygen dissolved in water, critical for respiration of aerobic aquatic life and organic oxidation.",
        "low_concern_action": "Investigate organic or chemical oxygen demand (BOD/COD) loading. Review artificial aeration and re-oxygenation requirements.",
        "high_concern_action": "Supersaturated oxygen observed. Often associated with intense algal photosynthesis during high sunlight."
    },
    "tds": {
        "name": "Total Dissolved Solids (TDS)",
        "unit": "mg/L",
        "physical_min": 0.0,
        "physical_max": 20000.0,
        "optimal_min": 50.0,
        "optimal_max": 500.0,
        "tolerable_min": 0.0,
        "tolerable_max": 1000.0,
        "standard_value": 500.0,
        "ideal_value": 0.0,
        "wqi_unit_weight": 0.0037,
        "reference_source": "IS 10500:2012 (Desirable: 500 mg/L, Permissible in absence of alternate source: 2000 mg/L)",
        "reference_organization": "Bureau of Indian Standards (BIS)",
        "exact_standard_document": "IS 10500:2012 Drinking Water Specification (Table 1, Item 4)",
        "publication_year": "2012",
        "water_use_category": "Potable Supply & Mineralization Screening",
        "geographic_jurisdiction": "India (National)",
        "threshold_source_type": "Official Standard",
        "verification_status": "Verified Standard Baseline",
        "is_core": True,
        "description": "Total concentration of dissolved inorganic salts and small amounts of organic matter.",
        "low_concern_action": "Very low mineralization (demineralized or pure rainwater profile).",
        "high_concern_action": "Conduct full ion chromatography to quantify predominant dissolved mineral salts (chlorides, sulfates, carbonates) and evaluate demineralization needs."
    },
    "electrical_conductivity": {
        "name": "Electrical Conductivity (EC)",
        "unit": "µS/cm",
        "physical_min": 0.0,
        "physical_max": 40000.0,
        "optimal_min": 100.0,
        "optimal_max": 750.0,
        "tolerable_min": 50.0,
        "tolerable_max": 1500.0,
        "standard_value": 750.0,
        "ideal_value": 0.0,
        "wqi_unit_weight": 0.0025,
        "reference_source": "WHO Guidelines for Drinking-Water Quality / FAO Irrigation Salinity Directives",
        "reference_organization": "WHO / FAO",
        "exact_standard_document": "WHO Guidelines (4th Ed) & FAO Irrigation and Drainage Paper 29 Rev. 1",
        "publication_year": "2011",
        "water_use_category": "Ionic Mobility & Salinity Screening",
        "geographic_jurisdiction": "International Guidelines",
        "threshold_source_type": "Application-Configured Screening Protocol",
        "verification_status": "Verified Application Baseline",
        "is_core": True,
        "description": "Electrolytic conductance of water, directly proportional to the total concentration of dissolved ionic charges.",
        "low_concern_action": "Low ionic conductance.",
        "high_concern_action": "Correlate with TDS ion balance and investigate potential high-ionic discharge sources in the catchment."
    },
    "hardness": {
        "name": "Total Hardness (as CaCO3)",
        "unit": "mg/L",
        "physical_min": 0.0,
        "physical_max": 2500.0,
        "optimal_min": 50.0,
        "optimal_max": 200.0,
        "tolerable_min": 0.0,
        "tolerable_max": 350.0,
        "standard_value": 200.0,
        "ideal_value": 0.0,
        "wqi_unit_weight": 0.0093,
        "reference_source": "IS 10500:2012 (Desirable 200 mg/L, Permissible 600 mg/L)",
        "reference_organization": "Bureau of Indian Standards (BIS)",
        "exact_standard_document": "IS 10500:2012 Drinking Water Specification (Table 1, Item 5)",
        "publication_year": "2012",
        "water_use_category": "Domestic Suitability & Scaling Potential",
        "geographic_jurisdiction": "India (National)",
        "threshold_source_type": "Official Standard",
        "verification_status": "Verified Standard Baseline",
        "is_core": False,
        "description": "Concentration of polyvalent metallic cations, predominantly calcium (Ca2+) and magnesium (Mg2+).",
        "low_concern_action": "Soft water detected. Highly corrosive to metal pipework in distribution circuits.",
        "high_concern_action": "Evaluate scaling potential for distribution equipment and assess water softening requirements."
    },
    "chloramines": {
        "name": "Chloramines",
        "unit": "mg/L",
        "physical_min": 0.0,
        "physical_max": 20.0,
        "optimal_min": 0.0,
        "optimal_max": 3.0,
        "tolerable_min": 0.0,
        "tolerable_max": 4.0,
        "standard_value": 4.0,
        "ideal_value": 0.0,
        "wqi_unit_weight": 0.4654,
        "reference_source": "WHO Guidelines / CPCB Advisory Screening Protocol (Application Screening Baseline: 0.0 - 3.0 mg/L, Critical: 4.0 mg/L)",
        "reference_organization": "WHO / Central Pollution Control Board (Advisory)",
        "exact_standard_document": "WHO Guidelines for Drinking-Water Quality (Monochloramine: 3.0 mg/L guideline value)",
        "publication_year": "2017",
        "water_use_category": "Distribution Disinfection Residual Screening",
        "geographic_jurisdiction": "International Guidelines / CPCB Screening",
        "threshold_source_type": "Application-Configured Screening Protocol",
        "verification_status": "Verified Application Baseline",
        "is_core": False,
        "description": "Chemical complexes of chlorine and ammonia utilized for secondary disinfection in water networks.",
        "low_concern_action": "No residual disinfectant detected. If treated supply, check chlorination dosing station.",
        "high_concern_action": "Inspect chloramination dosing controls and verify disinfection residual via standard DPD colorimetry to prevent taste, odor, or mucosal irritation."
    },
    "sulfate": {
        "name": "Sulfate (SO4)",
        "unit": "mg/L",
        "physical_min": 0.0,
        "physical_max": 5000.0,
        "optimal_min": 0.0,
        "optimal_max": 250.0,
        "tolerable_min": 0.0,
        "tolerable_max": 400.0,
        "standard_value": 250.0,
        "ideal_value": 0.0,
        "wqi_unit_weight": 0.0074,
        "reference_source": "IS 10500:2012 / WHO Guidelines (Acceptable: 200 mg/L, Permissible: 400 mg/L)",
        "reference_organization": "Bureau of Indian Standards (BIS)",
        "exact_standard_document": "IS 10500:2012 Drinking Water Specification (Table 1, Item 11)",
        "publication_year": "2012",
        "water_use_category": "Mineral Anion Screening",
        "geographic_jurisdiction": "India (National)",
        "threshold_source_type": "Official Standard",
        "verification_status": "Verified Standard Baseline",
        "is_core": False,
        "description": "Naturally occurring inorganic sulfur oxyanion; excessive amounts confer bitter taste and laxative effects.",
        "low_concern_action": "Normal low sulfate concentration. Maintain routine monitoring.",
        "high_concern_action": "Investigate mineral leaching, industrial effluent, or gypsum stratum dissolution; assess potential laxative and corrosive effects."
    },
    "organic_carbon": {
        "name": "Total Organic Carbon (TOC)",
        "unit": "mg/L",
        "physical_min": 0.0,
        "physical_max": 200.0,
        "optimal_min": 0.0,
        "optimal_max": 5.0,
        "tolerable_min": 0.0,
        "tolerable_max": 10.0,
        "standard_value": 5.0,
        "ideal_value": 0.0,
        "wqi_unit_weight": 0.3723,
        "reference_source": "EPA DBP Precursor Screening Framework / WHO Guidelines (Application Baseline: 0.0 - 5.0 mg/L, Critical: 10.0 mg/L)",
        "reference_organization": "US EPA / WHO",
        "exact_standard_document": "EPA Stage 1 & 2 Disinfectants and Disinfection Byproducts Rules (40 CFR 141.135)",
        "publication_year": "2006",
        "water_use_category": "Organic Contamination & Precursor Screening",
        "geographic_jurisdiction": "International Screening Framework",
        "threshold_source_type": "Application-Configured Screening Protocol",
        "verification_status": "Verified Application Baseline",
        "is_core": False,
        "description": "Amount of carbon bound in dissolved and particulate organic molecules. Serves as screening proxy for natural organic matter and DBP precursor evaluation.",
        "low_concern_action": "Low organic loading within optimal baseline. Maintain routine monitoring.",
        "high_concern_action": "Repeat the measurement and investigate possible elevated organic loading. Conduct appropriate COD and organic matter characterization, and evaluate disinfection byproduct formation potential if chlorination is used."
    }
}

CORE_PARAMETERS = [k for k, v in PARAMETER_CONFIGS.items() if v.get("is_core", False)]
OPTIONAL_PARAMETERS = [k for k, v in PARAMETER_CONFIGS.items() if not v.get("is_core", False)]

def validate_india_coordinates(lat: Optional[float], lon: Optional[float]) -> Tuple[bool, Optional[str]]:
    """
    Validates geographical coordinates within India territorial bounding box.
    Accepts latitude between 8.0° N and 37.0° N, and longitude between 68.0° E and 97.0° E.
    """
    if lat is None or lon is None:
        return True, None
    if not (8.0 <= lat <= 37.0):
        return False, f"Latitude {lat}° is outside the configured India territorial bounding box (8.0° N to 37.0° N)."
    if not (68.0 <= lon <= 97.0):
        return False, f"Longitude {lon}° is outside the configured India territorial bounding box (68.0° E to 97.0° E)."
    return True, None

def format_coordinates_cardinal(lat: Optional[float], lon: Optional[float]) -> str:
    """Format coordinates with explicit N/S and E/W cardinal indicators."""
    if lat is None or lon is None:
        return "Manual Entry (No GPS Telemetry)"
    lat_card = "N" if lat >= 0 else "S"
    lon_card = "E" if lon >= 0 else "W"
    return f"{abs(lat):.4f}° {lat_card}, {abs(lon):.4f}° {lon_card}"

def validate_parameter_value(param_key: str, val: Any) -> Tuple[bool, Optional[str], Optional[float]]:
    """
    Validates a parameter against physical instrument limits.
    Returns:
      (is_valid, error_message, parsed_float_or_None)
    """
    if val is None or val == "":
        # Missing values are allowed for optional parameters
        if param_key in OPTIONAL_PARAMETERS:
            return True, None, None
        return False, f"Parameter '{param_key}' is a required core measurement.", None

    try:
        fval = float(val)
    except (ValueError, TypeError):
        return False, f"Parameter '{param_key}' must be a valid numeric measurement.", None

    cfg = PARAMETER_CONFIGS.get(param_key)
    if not cfg:
        return True, None, fval

    pmin = cfg["physical_min"]
    pmax = cfg["physical_max"]

    if fval < pmin or fval > pmax:
        return (
            False,
            f"Measurement {fval} {cfg['unit']} is instrumentally/physically invalid for {cfg['name']}. Valid physical range: [{pmin}, {pmax}].",
            None
        )

    return True, None, fval

def evaluate_parameter_status(param_key: str, value: float) -> Dict[str, Any]:
    """
    Evaluates a physically valid measurement against configured screening baselines.
    Separates output into three independent, non-repeating components:
      A. Measurement Observation: Actual measured value and unit.
      B. Screening Interpretation: Comparison against configured threshold and severity.
      C. Recommended Action: Targeted action based on screening outcome.
    """
    cfg = PARAMETER_CONFIGS.get(param_key)
    if not cfg:
        return {
            "parameter": param_key,
            "name": param_key,
            "value": value,
            "unit": "",
            "status": "Normal",
            "optimal_range": "N/A",
            "reference_source": "General",
            "measurement_observation": f"{param_key}: measured {value}.",
            "screening_interpretation": "No screening baseline configured.",
            "recommended_action": "Maintain routine observation.",
            "observation": "No screening baseline configured.",
            "action_note": None,
            "severity_level": "Normal"
        }

    opt_min = cfg["optimal_min"]
    opt_max = cfg["optimal_max"]
    tol_min = cfg["tolerable_min"]
    tol_max = cfg["tolerable_max"]
    unit = cfg["unit"]
    name = cfg["name"]

    status = "Normal"
    severity = "Normal"

    # Display formatting: integer if exact, float otherwise
    v_disp = int(value) if isinstance(value, (int, float)) and float(value).is_integer() else (
        round(value, 2) if param_key in ["ph", "chloramines"] else round(value, 1)
    )

    # Component A: Measurement Observation (solely describes the measured value and unit)
    if param_key == "ph":
        meas_obs = f"pH measured at {value:.2f} pH units."
    elif param_key == "turbidity":
        meas_obs = f"Turbidity measured at {value:.1f} NTU."
    elif param_key == "temperature":
        meas_obs = f"Water Temperature measured at {value:.1f} °C."
    elif param_key == "dissolved_oxygen":
        meas_obs = f"Dissolved Oxygen measured at {value:.2f} mg/L."
    elif param_key in ["tds", "electrical_conductivity", "hardness", "sulfate"]:
        meas_obs = f"{name} measured at {v_disp} {unit}."
    elif param_key == "chloramines":
        meas_obs = f"Chloramines measured at {v_disp} mg/L."
    elif param_key == "organic_carbon":
        meas_obs = f"Total Organic Carbon measured at {v_disp} mg/L."
    else:
        meas_obs = f"{name} measured at {v_disp} {unit}."

    # Component B: Screening Interpretation (comparison vs configured threshold & severity)
    # Component C: Recommended Action (targeted action based on screening outcome)
    obs_compat = None
    action_compat = None

    if opt_min is not None and value < opt_min:
        if tol_min is not None and value < tol_min:
            status = "Critical Low"
            severity = "High"
            thresh_disp = int(tol_min) if tol_min.is_integer() else tol_min
            if param_key == "ph":
                screen_interp = f"Significantly below the configured critical minimum screening threshold of {tol_min:.1f}. Parameter severity: Critical Low."
                rec_action = "Inspect potential acidic industrial discharge or acid mine drainage. Calibrate electrode and perform duplicate laboratory re-test."
                obs_compat = f"pH measured at {value:.2f}, below configured critical threshold of {tol_min:.1f}."
                action_compat = rec_action
            elif param_key == "dissolved_oxygen":
                screen_interp = f"Significantly below the configured critical minimum screening threshold of {tol_min:.1f} mg/L. Parameter severity: Critical Low."
                rec_action = "Investigate organic or chemical oxygen demand (BOD/COD) loading. Review artificial aeration and re-oxygenation requirements."
                obs_compat = f"Dissolved Oxygen measured at {value:.2f} mg/L, below configured critical threshold of {tol_min:.1f} mg/L."
                action_compat = rec_action
            else:
                screen_interp = f"Significantly below the configured critical minimum threshold of {thresh_disp} {unit}. Parameter severity: Critical Low."
                rec_action = cfg.get("low_concern_action")
                obs_compat = screen_interp
                action_compat = rec_action
        else:
            status = "Low"
            severity = "Medium"
            screen_interp = f"Below optimal baseline ({opt_min}–{opt_max} {unit}) but above critical threshold of {tol_min} {unit}. Parameter severity: Low."
            rec_action = cfg.get("low_concern_action")
            obs_compat = screen_interp
            action_compat = rec_action

    elif opt_max is not None and value > opt_max:
        thresh_val = int(tol_max) if tol_max is not None and tol_max.is_integer() else tol_max
        if tol_max is not None and value > tol_max:
            status = "Critical High"
            severity = "High"

            if param_key == "turbidity":
                screen_interp = f"Exceeds the configured critical turbidity screening threshold of {thresh_val} NTU. Parameter severity: Critical High."
                rec_action = "Conduct jar settling tests to characterize suspended particulate behavior, inspect upstream erosion/soil disturbance, and verify nephelometric optical sensor calibration."
                obs_compat = f"Exceeds the configured critical turbidity screening threshold of {thresh_val} NTU."
                action_compat = f"Exceeds the configured critical turbidity screening threshold of {thresh_val} NTU. {rec_action}"
            elif param_key == "tds":
                screen_interp = f"Exceeds the configured critical TDS screening threshold of {thresh_val} mg/L. Parameter severity: Critical High."
                rec_action = "Conduct full ion chromatography to quantify predominant dissolved mineral salts (chlorides, sulfates, carbonates) and evaluate demineralization needs."
                obs_compat = f"Total Dissolved Solids measured at {v_disp} mg/L, exceeding the configured critical TDS screening threshold of {thresh_val} mg/L."
                action_compat = rec_action
            elif param_key == "electrical_conductivity":
                screen_interp = f"Exceeds the configured critical EC screening threshold of {thresh_val} µS/cm. Parameter severity: Critical High."
                rec_action = "Correlate with TDS ion balance and investigate potential high-ionic discharge sources in the catchment."
                obs_compat = f"Electrical Conductivity measured at {v_disp} µS/cm, exceeding the configured critical EC screening threshold of {thresh_val} µS/cm."
                action_compat = rec_action
            elif param_key == "hardness":
                screen_interp = f"Exceeds the configured critical hardness screening threshold of {thresh_val} mg/L. Parameter severity: Critical High."
                rec_action = "Evaluate scaling potential for distribution equipment and assess water softening requirements."
                obs_compat = f"Total Hardness measured at {v_disp} mg/L, exceeding the configured critical hardness screening threshold of {thresh_val} mg/L."
                action_compat = rec_action
            elif param_key == "chloramines":
                screen_interp = f"Exceeds the configured critical screening threshold of {thresh_val} mg/L. Parameter severity: Critical High."
                rec_action = "Exceeds application screening threshold. Inspect chloramination dosing controls and verify disinfection residual via standard DPD colorimetry to prevent taste, odor, or mucosal irritation."
                obs_compat = f"Chloramines measured at {v_disp} mg/L, exceeding the configured critical chloramines screening threshold of {thresh_val} mg/L."
                action_compat = rec_action
            elif param_key == "sulfate":
                screen_interp = f"Exceeds the configured critical sulfate screening threshold of {thresh_val} mg/L. Parameter severity: Critical High."
                rec_action = "Investigate mineral leaching, industrial effluent, or gypsum stratum dissolution; assess potential laxative and corrosive effects."
                obs_compat = f"Sulfate measured at {v_disp} mg/L, exceeding the configured critical sulfate screening threshold of {thresh_val} mg/L."
                action_compat = rec_action
            elif param_key == "organic_carbon":
                screen_interp = f"Significantly exceeds the configured critical screening threshold of {thresh_val} mg/L. Parameter severity: Critical High."
                rec_action = "Repeat the measurement and investigate possible elevated organic loading. Conduct appropriate COD and organic matter characterization, and evaluate disinfection byproduct formation potential if chlorination is used."
                obs_compat = f"Total Organic Carbon measured at {v_disp} mg/L, significantly exceeding the configured critical screening threshold of {thresh_val} mg/L. {rec_action}"
                action_compat = rec_action
            elif param_key == "ph":
                screen_interp = f"Significantly above the configured critical maximum screening threshold of {tol_max:.1f}. Parameter severity: Critical High."
                rec_action = "Inspect potential caustic industrial streams or alkaline runoff. Verify electrode calibration with standard pH buffers and re-test."
                obs_compat = f"pH measured at {value:.2f}, exceeding the configured critical maximum threshold of {tol_max:.1f}."
                action_compat = rec_action
            elif param_key == "temperature":
                screen_interp = f"Exceeds the configured critical maximum temperature screening threshold of {tol_max:.1f} °C. Parameter severity: Critical High."
                rec_action = "Evaluate potential thermal discharge sources or unshaded stagnant holding conditions affecting dissolved gas solubility."
                obs_compat = f"Temperature measured at {value:.1f} °C, exceeding the configured critical maximum threshold of {tol_max:.1f} °C."
                action_compat = rec_action
            else:
                screen_interp = f"Exceeds the configured critical screening threshold of {thresh_val} {unit}. Parameter severity: Critical High."
                rec_action = cfg.get("high_concern_action")
                obs_compat = screen_interp
                action_compat = rec_action
        else:
            status = "Elevated"
            severity = "Medium"
            if param_key == "organic_carbon":
                screen_interp = f"Total Organic Carbon is slightly above the configured screening baseline (baseline {opt_min}–{opt_max} {unit}). Parameter severity: Elevated."
                rec_action = "Repeat the measurement and consider additional organic matter characterization. If chlorination is used, evaluate disinfection byproduct formation potential through appropriate laboratory testing."
                obs_compat = f"Total Organic Carbon is slightly above the configured screening baseline (baseline {opt_min}–{opt_max} {unit})."
                action_compat = f"Total Organic Carbon is slightly above the configured screening baseline (baseline {opt_min}–{opt_max} {unit}). {rec_action}"
            elif param_key == "turbidity":
                screen_interp = f"Elevated above optimal baseline ({opt_min}–{opt_max} {unit}) but below critical screening threshold of {thresh_val} {unit}. Parameter severity: Elevated."
                rec_action = "Inspect upstream surface runoff and verify nephelometric optical sensor calibration."
                obs_compat = f"Turbidity elevated above optimal baseline ({opt_min}–{opt_max} {unit})."
                action_compat = rec_action
            else:
                screen_interp = f"Elevated above optimal baseline ({opt_min}–{opt_max} {unit}) but below critical threshold of {thresh_val} {unit}. Parameter severity: Elevated."
                rec_action = cfg.get("high_concern_action")
                obs_compat = screen_interp
                action_compat = rec_action
    else:
        status = "Normal"
        severity = "Normal"
        screen_interp = f"Within configured screening baseline ({opt_min}–{opt_max} {unit}). Parameter severity: Normal."
        rec_action = "Maintain routine scheduled monitoring per local water management plan."
        obs_compat = screen_interp
        action_compat = rec_action

    opt_range_str = f"{opt_min if opt_min is not None else 0} - {opt_max if opt_max is not None else 'N/A'} {unit}"

    return {
        "parameter": param_key,
        "name": cfg["name"],
        "value": round(value, 2),
        "unit": unit,
        "status": status,
        "severity_level": severity,
        "optimal_range": opt_range_str,
        "reference_source": cfg.get("reference_source", "Guideline"),
        "reference_organization": cfg.get("reference_organization", "CPCB / BIS / WHO"),
        "exact_standard_document": cfg.get("exact_standard_document", "IS 10500:2012 / CPCB Guidelines"),
        "water_use_category": cfg.get("water_use_category", "Screening"),
        "threshold_source_type": cfg.get("threshold_source_type", "Application-Configured Screening Protocol"),
        "measurement_observation": meas_obs,
        "screening_interpretation": screen_interp,
        "recommended_action": rec_action,
        # Backwards compatibility fields
        "observation": obs_compat or screen_interp,
        "action_note": action_compat or rec_action
    }

def calculate_tds_ec_ratio(
    tds: Optional[float],
    ec: Optional[float],
    water_source_name: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Computes and evaluates the empirical TDS/EC ratio.
    Configured expected empirical screening range is 0.550 to 0.700.
    
    Formula:
      TDS/EC Ratio = TDS (mg/L) / EC (µS/cm)
    
    Scientific & Source-Specific Interpretation:
      Calculated TDS/EC ratio falls within the application's configured empirical screening range.
      This indicates proportional consistency between the two measurements but does not establish
      water quality, sensor accuracy, or ionic composition.
      For industrial discharge outfalls or specialized wastewater matrices, specific ionic species
      govern conductance and require laboratory ionic chromatography rather than natural freshwater
      empirical assumptions.
    """
    if tds is None or ec is None or ec <= 0:
        return None

    ratio = round(tds / ec, 3)
    min_exp, max_exp = 0.550, 0.700
    is_in_range = min_exp <= ratio <= max_exp

    formula_str = "TDS/EC Ratio = TDS (mg/L) / EC (µS/cm)"
    substitution_str = f"{tds:.1f} / {ec:.1f} = {ratio:.3f}"
    expected_range_str = f"{min_exp:.3f}–{max_exp:.3f}"

    if is_in_range:
        conclusion_str = (
            "Calculated TDS/EC ratio falls within the application's configured empirical screening range. "
            "This indicates proportional consistency between the two measurements but does not establish water quality, sensor accuracy, or ionic composition."
        )
    elif ratio < min_exp:
        conclusion_str = (
            f"Calculated TDS/EC ratio of {ratio:.3f} falls below the application's configured empirical screening range ({expected_range_str}). "
            "This indicates higher relative conductivity, possible presence of highly mobile inorganic ions (such as chlorides or nitrates), or potential measurement offset, but does not establish water quality, sensor accuracy, or ionic composition."
        )
    else:
        conclusion_str = (
            f"Calculated TDS/EC ratio of {ratio:.3f} exceeds the application's configured empirical screening range ({expected_range_str}). "
            "This indicates elevated non-conductive dissolved solids, neutral organic matter, or potential measurement offset, but does not establish water quality, sensor accuracy, or ionic composition."
        )

    # Source-specific contextual disclaimer
    is_industrial = False
    if water_source_name:
        src_lower = water_source_name.lower()
        if any(term in src_lower for term in ["industrial", "discharge", "effluent", "drainage", "outfall"]):
            is_industrial = True

    context_limitation = (
        "Empirical screening range (0.550–0.700) represents an application screening baseline. "
        "For industrial discharge outfalls or specialized wastewater matrices, specific ionic species govern conductance and require laboratory ionic chromatography rather than natural freshwater empirical assumptions."
        if is_industrial else
        "Calculated screening indicator of physical-chemical consistency. Does not establish sensor calibration accuracy, water safety, or certified potability."
    )

    return {
        "calculated_ratio": ratio,
        "tds_value": round(tds, 1),
        "ec_value": round(ec, 1),
        "formula": formula_str,
        "substitution": substitution_str,
        "expected_range_min": min_exp,
        "expected_range_max": max_exp,
        "expected_range_str": expected_range_str,
        "is_within_range": is_in_range,
        "ratio_status": "Within Expected Range" if is_in_range else "Outside Expected Range",
        "ratio_conclusion": conclusion_str,
        "evaluation_summary": conclusion_str,
        "context_limitation": context_limitation,
        "scientific_disclaimer": (
            "Empirical screening check for physical-chemical consistency. "
            "This ratio cannot establish instrument calibration accuracy or identify specific dissolved ionic species."
        )
    }

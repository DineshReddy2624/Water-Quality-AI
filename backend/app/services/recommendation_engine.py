"""
Rule-Based Water Quality Recommendation Engine.

Generates targeted, actionable, parameter-specific recommendations and investigation
advisories based on actual measured values, severities, and multivariate anomalies.

Educational & Scientific Notice:
Recommendations provide decision support for field personnel and environmental managers.
They do not identify specific chemical toxins or certify safety without accredited
laboratory confirmatory testing.
"""

from typing import Dict, Any, List
from app.core.parameter_config import PARAMETER_CONFIGS, evaluate_parameter_status

def generate_recommendations(
    params: Dict[str, Any],
    observations: List[Dict[str, Any]],
    wqi_score: float,
    is_anomaly: bool,
    severity: str
) -> List[Dict[str, Any]]:
    """
    Generates actionable recommendations tied directly to measured abnormal parameters.
    """
    recommendations: List[Dict[str, Any]] = []
    seen_titles = set()

    def add_rec(title: str, desc: str, category: str, priority: str):
        if title not in seen_titles:
            seen_titles.add(title)
            recommendations.append({
                "title": title,
                "description": desc,
                "category": category,
                "priority": priority
            })

    # 1. Parameter-specific actionable rules
    for obs in observations:
        p_key = obs.get("parameter")
        status = obs.get("status", "Normal")
        val = obs.get("value", 0.0)
        unit = obs.get("unit", "")
        cfg = PARAMETER_CONFIGS.get(p_key, {})

        if status == "Normal":
            continue

        if p_key == "ph":
            if "Low" in status:
                add_rec(
                    title="Confirmatory pH Calibration and Acidity Profiling",
                    desc=f"Measured pH is {val} (below baseline {obs.get('optimal_range')}). Perform 2-point buffer calibration (pH 4.0 & 7.0) on field sensor and test for acidic precipitation or mineral oxidation.",
                    category="Calibration",
                    priority="High" if "Critical" in status else "Medium"
                )
            else:
                add_rec(
                    title="Alkalinity and Caustic Discharge Investigation",
                    desc=f"Measured pH is {val} (above baseline {obs.get('optimal_range')}). Investigate agricultural alkaline runoff, photosynthetic bloom activity, or industrial caustic outfalls.",
                    category="Investigation",
                    priority="High" if "Critical" in status else "Medium"
                )

        elif p_key == "turbidity":
            if val >= 10.0:
                add_rec(
                    title="Elevated Turbidity & Optical Sensor Verification",
                    desc=f"Exceeds the configured critical turbidity screening threshold of 10 NTU (measured {val} NTU vs optimal baseline 0.0 - 5.0 NTU). Perform jar settling tests to determine flocculation/sediment behavior, inspect upstream erosion/soil disturbance, and verify nephelometric optical sensor calibration.",
                    category="Sampling",
                    priority="High"
                )
            else:
                add_rec(
                    title="Suspended Particulate and Filtration Screening",
                    desc=f"Measured turbidity is {val} NTU (baseline {obs.get('optimal_range')}). Perform jar testing for sediment settling, inspect upstream erosion/soil disturbance, and verify optical nephelometric sensor optics.",
                    category="Sampling",
                    priority="Medium"
                )

        elif p_key == "dissolved_oxygen":
            if "Low" in status:
                add_rec(
                    title="Hypoxia Assessment and Aeration Review",
                    desc=f"Dissolved oxygen measured at {val} mg/L (below optimal baseline {obs.get('optimal_range')}). Inspect for high biological or chemical oxygen demand (BOD/COD), sewage influx, or stagnant thermal stratification.",
                    category="Investigation",
                    priority="High" if "Critical" in status else "Medium"
                )
            else:
                add_rec(
                    title="Photosynthetic Supersaturation Monitoring",
                    desc=f"Dissolved oxygen measured at {val} mg/L. Check for daytime algal supersaturation or high turbulence.",
                    category="Monitoring",
                    priority="Low"
                )

        elif p_key == "tds":
            v_int = int(val) if isinstance(val, (int, float)) and float(val).is_integer() else val
            if "Critical" in status or val > 1000.0:
                add_rec(
                    title="Total Dissolved Solids (TDS) Investigation & Salinity Management",
                    desc=f"Total Dissolved Solids measured at {v_int} mg/L, exceeding the configured critical TDS screening threshold of 1000 mg/L (optimal baseline 50.0 - 500.0 mg/L). Recommend comprehensive ion chromatography (chloride, sulfate, calcium, sodium), evaluation of mineral/saline leaching, and assessment of reverse osmosis or electrodialysis treatment.",
                    category="Laboratory",
                    priority="High"
                )
            else:
                add_rec(
                    title="Dissolved Solids & Salinity Ion Chromatography",
                    desc=f"Total Dissolved Solids measured at {v_int} mg/L (optimal baseline {obs.get('optimal_range')}). Recommend anion/cation screening (chloride, sulfate, calcium, sodium) to evaluate mineralization sources.",
                    category="Laboratory",
                    priority="Medium"
                )

        elif p_key == "electrical_conductivity":
            v_int = int(val) if isinstance(val, (int, float)) and float(val).is_integer() else val
            if "Critical" in status or val > 1500.0:
                add_rec(
                    title="Electrical Conductivity (EC) Probe Verification & Ionic Audit",
                    desc=f"Electrical Conductivity measured at {v_int} µS/cm, exceeding the configured critical EC screening threshold of 1500 µS/cm (optimal baseline 100.0 - 750.0 µS/cm). Cross-check against the empirical TDS/EC ratio (configured expected range 0.55–0.70) to identify specific inorganic electrolyte spikes and calibrate conductivity cells.",
                    category="Calibration",
                    priority="High"
                )
            else:
                add_rec(
                    title="Conductivity Probe Re-verification & Ionic Strength Check",
                    desc=f"Electrical conductivity measured at {v_int} µS/cm (optimal baseline {obs.get('optimal_range')}). Cross-check against TDS ratio (expected TDS/EC ratio typically 0.55 - 0.70) to identify specific inorganic electrolyte spikes.",
                    category="Calibration",
                    priority="Medium"
                )

        elif p_key == "temperature":
            if "High" in status or val > 28.0:
                add_rec(
                    title="Thermal Outfall & Cooling Discharge Screening",
                    desc=f"Water temperature is {val} °C (baseline {obs.get('optimal_range')}). Check for industrial cooling water effluents or shallow stagnant sunlight exposure that may accelerate oxygen depletion.",
                    category="Investigation",
                    priority="Medium"
                )

        elif p_key == "hardness":
            v_int = int(val) if isinstance(val, (int, float)) and float(val).is_integer() else val
            if "Critical" in status or val > 350.0:
                add_rec(
                    title="Total Hardness Cation Profiling (Ca²⁺ / Mg²⁺) & Scaling Mitigation",
                    desc=f"Total Hardness measured at {v_int} mg/L, exceeding the configured critical hardness screening threshold of 350 mg/L (optimal baseline 50.0 - 200.0 mg/L). Evaluate scaling risks in piping and boilers, and assess lime-soda softening or ion exchange resin treatment.",
                    category="Laboratory",
                    priority="High"
                )
            else:
                add_rec(
                    title="Hardness Cation Assay (Ca2+ / Mg2+)",
                    desc=f"Total hardness measured at {v_int} mg/L (optimal baseline {obs.get('optimal_range')}). Evaluate domestic scaling risk and limestone stratum contact.",
                    category="Monitoring",
                    priority="Medium"
                )

        elif p_key == "chloramines":
            if "Critical" in status or val > 4.0:
                add_rec(
                    title="Disinfectant Dosing System Audit & Residual Mitigation",
                    desc=f"Chloramines measured at {val} mg/L, exceeding the configured critical screening threshold of 4.0 mg/L (optimal baseline 0.0 - 3.0 mg/L). Inspect dosing pump controls to prevent taste, odor, or mucosal irritation. Notice: This is an application screening threshold, not certified regulatory testing under IS 10500:2012 or CPCB standards.",
                    category="Investigation",
                    priority="High"
                )
            else:
                add_rec(
                    title="Disinfectant Dosing System Audit",
                    desc=f"Chloramines measured at {val} mg/L (baseline {obs.get('optimal_range')}). Review chloramination ammonia-to-chlorine injection ratios to avoid excess residual formation.",
                    category="Investigation",
                    priority="Medium"
                )

        elif p_key == "sulfate":
            v_int = int(val) if isinstance(val, (int, float)) and float(val).is_integer() else val
            if "Critical" in status or val > 400.0:
                add_rec(
                    title="Sulfate Mineral Leaching & Industrial Gypsum Inspection",
                    desc=f"Sulfate measured at {v_int} mg/L, exceeding the configured critical sulfate screening threshold of 400 mg/L (optimal baseline 0.0 - 250.0 mg/L). Inspect upstream geological gypsum dissolution, industrial sulfate effluent, or acid mine drainage.",
                    category="Laboratory",
                    priority="High"
                )
            else:
                add_rec(
                    title="Sulfate Mineral Leaching & Mine Runoff Inspection",
                    desc=f"Sulfate measured at {v_int} mg/L (baseline {obs.get('optimal_range')}). Inspect upstream geological strata, mine drainage, or industrial gypsum discharge.",
                    category="Laboratory",
                    priority="Medium"
                )

        elif p_key == "organic_carbon":
            if "Critical" in status or val > 10.0:
                add_rec(
                    title="Elevated Total Organic Carbon (TOC) & Organic Loading Investigation",
                    desc=f"Total Organic Carbon measured at {val} mg/L, significantly exceeding the configured critical screening threshold of 10 mg/L. Repeat the measurement and investigate possible elevated organic loading. Conduct appropriate COD and organic matter characterization, and evaluate disinfection byproduct formation potential if chlorination is used.",
                    category="Laboratory",
                    priority="High"
                )
            elif val > 5.0:
                add_rec(
                    title="Total Organic Carbon (TOC) Baseline Screening",
                    desc=f"Total Organic Carbon is slightly above the configured screening baseline (measured {val} mg/L vs baseline 0.0 - 5.0 mg/L). Repeat the measurement and consider additional organic matter characterization. If chlorination is used, evaluate disinfection byproduct formation potential through appropriate laboratory testing.",
                    category="Investigation",
                    priority="Medium"
                )

    # 2. Multivariate / Multi-abnormal general recommendation
    abnormal_count = sum(1 for o in observations if o.get("status") != "Normal")
    if abnormal_count >= 3 or severity == "High" or wqi_score < 40.0:
        add_rec(
            title="Multi-Parameter Confirmatory Sample & Accredited Laboratory Testing",
            desc=f"Multiple abnormal measurements ({abnormal_count} parameters) detected simultaneously. Collect duplicate split samples and dispatch to an ISO/IEC 17025 accredited laboratory for full chemical and microbiological assay.",
            category="Laboratory",
            priority="High"
        )

    # 3. Baseline routine recommendation if all normal
    if not recommendations:
        add_rec(
            title="Maintain Routine Scheduled Monitoring",
            desc="All evaluated measurements fall within configured screening baselines. Maintain routine sampling frequency as specified in the environmental monitoring plan.",
            category="Monitoring",
            priority="Low"
        )

    return recommendations

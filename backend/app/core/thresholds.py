from typing import Dict, Any, List

"""
Water Quality Parameter Screening Thresholds (Demonstration & Decision Support).
Notice: This application is an educational screening and decision-support system.
Configured thresholds are illustrative screening baselines inspired by general guidelines
(e.g., WHO, EPA, Bureau of Indian Standards) and should not be construed as regulatory
or laboratory certification.
"""

DEFAULT_THRESHOLDS: Dict[str, Dict[str, Any]] = {
    "ph": {
        "name": "pH Level",
        "unit": "pH units",
        "optimal_min": 6.5,
        "optimal_max": 8.5,
        "tolerable_min": 6.0,
        "tolerable_max": 9.0,
        "description": "Indicates acidity or alkalinity. Normal range is between 6.5 and 8.5.",
        "low_concern_action": "Acidic condition detected. Investigate potential industrial runoff, acid precipitation, or mineral oxidation.",
        "high_concern_action": "Alkaline condition detected. Investigate agricultural fertilizer runoff, caustic discharges, or algal blooms."
    },
    "turbidity": {
        "name": "Turbidity",
        "unit": "NTU",
        "optimal_min": 0.0,
        "optimal_max": 5.0,
        "tolerable_min": 0.0,
        "tolerable_max": 10.0,
        "description": "Measurement of water cloudiness due to suspended particles. Configured screening ranges: Optimal baseline: 0–5 NTU; Elevated range: Above 5 NTU; Configured critical range: Above 10 NTU. These are application screening configurations and must not be represented as universally applicable regulatory limits.",
        "high_concern_action": "Exceeds the configured critical turbidity screening threshold of 10 NTU. Perform jar settling tests to determine flocculation/sediment behavior, inspect upstream erosion/soil disturbance, and verify nephelometric optical sensor calibration."
    },
    "temperature": {
        "name": "Water Temperature",
        "unit": "°C",
        "optimal_min": 15.0,
        "optimal_max": 28.0,
        "tolerable_min": 10.0,
        "tolerable_max": 32.0,
        "description": "Thermal condition. High temperatures decrease dissolved oxygen solubility and accelerate biochemical degradation.",
        "high_concern_action": "Thermal anomaly detected. Inspect thermal discharge outfalls or shallow seasonal stagnant ponding."
    },
    "dissolved_oxygen": {
        "name": "Dissolved Oxygen (DO)",
        "unit": "mg/L",
        "optimal_min": 6.0,
        "optimal_max": 14.0,
        "tolerable_min": 4.5,
        "tolerable_max": 16.0,
        "description": "Crucial for aquatic life and aerobic ecosystem health. Healthy freshwater typically contains > 6.0 mg/L.",
        "low_concern_action": "Depleted dissolved oxygen indicates high biological/chemical oxygen demand (BOD/COD) or eutrophication. Investigate sewage or organic loading."
    },
    "tds": {
        "name": "Total Dissolved Solids (TDS)",
        "unit": "mg/L",
        "optimal_min": 50.0,
        "optimal_max": 500.0,
        "tolerable_min": 0.0,
        "tolerable_max": 1000.0,
        "description": "Total combined inorganic and organic substances in molecular, ionized, or micro-granular suspended form.",
        "high_concern_action": "Elevated TDS points to mineral leaching, saltwater intrusion, or industrial/agricultural saline discharge."
    },
    "electrical_conductivity": {
        "name": "Electrical Conductivity (EC)",
        "unit": "µS/cm",
        "optimal_min": 100.0,
        "optimal_max": 750.0,
        "tolerable_min": 50.0,
        "tolerable_max": 1500.0,
        "description": "Water's capacity to conduct an electric current, directly proportional to dissolved ion concentration.",
        "high_concern_action": "Elevated conductivity indicates high ionic content (chloride, sulfate, sodium, calcium). Correlate with TDS and run chemical analysis."
    },
    "hardness": {
        "name": "Total Hardness (as CaCO3)",
        "unit": "mg/L",
        "optimal_min": 50.0,
        "optimal_max": 200.0,
        "tolerable_min": 0.0,
        "tolerable_max": 350.0,
        "description": "Concentration of divalent metal cations, primarily calcium and magnesium.",
        "high_concern_action": "Hard water detected. Can cause scaling in pipes; investigate limestone aquifer or calcium leaching."
    },
    "chloramines": {
        "name": "Chloramines",
        "unit": "mg/L",
        "optimal_min": 0.0,
        "optimal_max": 3.0,
        "tolerable_min": 0.0,
        "tolerable_max": 4.0,
        "description": "Chlorine derivatives used for residual disinfection. Elevated levels can irritate skin or indicate over-chlorination. Configured screening baseline: 0.0-3.0 mg/L; Critical: 4.0 mg/L.",
        "high_concern_action": "Elevated chloramines exceeding configured critical screening threshold of 4.0 mg/L. Inspect dosing pump controls to prevent taste, odor, or mucosal irritation. Notice: This is an application screening threshold, not certified regulatory testing under IS 10500:2012 or CPCB standards."
    },
    "sulfate": {
        "name": "Sulfate (SO4)",
        "unit": "mg/L",
        "optimal_min": 0.0,
        "optimal_max": 250.0,
        "tolerable_min": 0.0,
        "tolerable_max": 400.0,
        "description": "Naturally occurring mineral compound. High sulfate may cause bitter taste or laxative effects.",
        "high_concern_action": "Excess sulfate observed. Investigate mining runoff, industrial effluent, or gypsum dissolution."
    },
    "organic_carbon": {
        "name": "Total Organic Carbon (TOC)",
        "unit": "mg/L",
        "optimal_min": 0.0,
        "optimal_max": 5.0,
        "tolerable_min": 0.0,
        "tolerable_max": 10.0,
        "description": "Amount of carbon bound in organic compounds; an index of natural organic matter and possible contamination. Configured baseline: 0-5 mg/L; Critical: 10 mg/L.",
        "high_concern_action": "Total Organic Carbon is above configured screening baseline. Repeat the measurement and consider additional organic matter characterization. If chlorination is used, evaluate disinfection byproduct formation potential through appropriate laboratory testing."
    }
}

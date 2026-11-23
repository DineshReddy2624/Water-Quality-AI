# AquaSense AI - Sample Water Quality Datasets

This directory contains illustrative reference datasets and manual testing samples for the **Intelligent Water Quality Monitoring and Contamination Analysis System**.

## Files

1. `sample_water_quality.csv`
   - Contains 32 realistic illustrative water samples across 5 monitoring locations.
   - Covers all four quality classes: Good Quality, Moderate Quality, Poor Quality, and Potentially Contaminated.
   - Includes full parameter spectrum: pH, Turbidity (NTU), Temperature (°C), Dissolved Oxygen (mg/L), TDS (mg/L), Electrical Conductivity (µS/cm), Hardness, Chloramines, Sulfate, Organic Carbon.
   - Suitable for CSV dataset upload, preview, and batch database import.

2. `manual_testing_samples.json`
   - Contains the 6 required manual testing scenarios:
     - **Scenario 1 (WQ001)**: Normal Water Sample (Lake A) - Baseline normal values.
     - **Scenario 2 (WQ002)**: Acidic Water Sample (Industrial Zone) - pH 5.2, elevated TDS and EC, low DO.
     - **Scenario 3 (WQ003)**: High Turbidity Sample (River Source B) - Turbidity 15.0 NTU.
     - **Scenario 4 (WQ004)**: High TDS Sample (Groundwater Zone) - TDS 1200 mg/L, EC 1800 µS/cm.
     - **Scenario 5 (WQ005)**: Low Dissolved Oxygen Sample (Reservoir C) - DO 2.5 mg/L, Temp 30°C.
     - **Scenario 6 (WQ006)**: Multiple Abnormal Parameters (Industrial Discharge Area) - Severe low pH (4.5), Turbidity 20 NTU, DO 2.0 mg/L, TDS 1500 mg/L, EC 2200 µS/cm.

## Educational Disclaimer
These datasets are illustrative software engineering and screening tools. They are not certified laboratory standards and do not replace certified drinking water safety protocols.

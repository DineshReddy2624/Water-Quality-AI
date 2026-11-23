import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, List

FEATURE_COLUMNS = [
    "ph",
    "turbidity",
    "temperature",
    "dissolved_oxygen",
    "tds",
    "electrical_conductivity",
    "hardness",
    "chloramines",
    "sulfate",
    "organic_carbon"
]

CORE_FEATURE_COLUMNS = [
    "ph",
    "turbidity",
    "temperature",
    "dissolved_oxygen",
    "tds",
    "electrical_conductivity"
]

DEFAULT_FEATURE_MEANS = {
    "ph": 7.2,
    "turbidity": 3.5,
    "temperature": 23.5,
    "dissolved_oxygen": 6.8,
    "tds": 450.0,
    "electrical_conductivity": 650.0,
    "hardness": 150.0,
    "chloramines": 2.2,
    "sulfate": 200.0,
    "organic_carbon": 4.5
}

def clean_water_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans raw uploaded water dataset.
    Detects missing values, removes duplicates, handles invalid/outlier entries,
    and returns cleaned DataFrame along with preprocessing metrics.
    """
    original_row_count = len(df)
    
    # 1. Standardize column names (lowercase, stripped, replace spaces/hyphens with _)
    clean_cols = {}
    for col in df.columns:
        norm = str(col).strip().lower().replace(" ", "_").replace("-", "_")
        # Map common synonyms
        if norm in ["ph_level", "ph_value"]:
            norm = "ph"
        elif norm in ["turb", "turbidity_ntu"]:
            norm = "turbidity"
        elif norm in ["temp", "temp_c", "temperature_c"]:
            norm = "temperature"
        elif norm in ["do", "dissolved_o2", "dissolved_oxygen_mg_l"]:
            norm = "dissolved_oxygen"
        elif norm in ["total_dissolved_solids", "tds_mg_l"]:
            norm = "tds"
        elif norm in ["conductivity", "ec", "electrical_conductivity_us_cm"]:
            norm = "electrical_conductivity"
        elif norm in ["organic_c", "toc"]:
            norm = "organic_carbon"
        clean_cols[col] = norm
    
    df = df.rename(columns=clean_cols)

    # 2. Duplicate detection and removal
    subset_cols = [c for c in FEATURE_COLUMNS if c in df.columns]
    duplicate_count = int(df.duplicated(subset=subset_cols).sum())
    df = df.drop_duplicates(subset=subset_cols)

    # 3. Numeric conversion and invalid measurement detection
    invalid_count = 0
    missing_handled = 0
    
    for col in FEATURE_COLUMNS:
        if col in df.columns:
            # Force numeric
            non_numeric = pd.to_numeric(df[col], errors='coerce').isna() & df[col].notna()
            invalid_count += int(non_numeric.sum())
            df[col] = pd.to_numeric(df[col], errors='coerce')

            # Range physical constraints (e.g. pH must be between 0 and 14)
            if col == "ph":
                out_of_bounds = (df[col] < 0) | (df[col] > 14)
                invalid_count += int(out_of_bounds.sum())
                df.loc[out_of_bounds, col] = np.nan
            elif col in ["turbidity", "dissolved_oxygen", "tds", "electrical_conductivity", "hardness", "chloramines", "sulfate", "organic_carbon"]:
                negative = df[col] < 0
                invalid_count += int(negative.sum())
                df.loc[negative, col] = np.nan
            elif col == "temperature":
                extreme_temp = (df[col] < -10) | (df[col] > 80)
                invalid_count += int(extreme_temp.sum())
                df.loc[extreme_temp, col] = np.nan

            # Count and impute missing values with median or default mean
            col_missing = int(df[col].isna().sum())
            if col_missing > 0:
                missing_handled += col_missing
                impute_val = df[col].median() if not df[col].dropna().empty else DEFAULT_FEATURE_MEANS.get(col, 0.0)
                df[col] = df[col].fillna(impute_val)
        else:
            # Column entirely missing from file, populate with baseline
            df[col] = DEFAULT_FEATURE_MEANS.get(col, 0.0)

    # 4. Outlier detection using IQR on core parameters
    outlier_count = 0
    for col in CORE_FEATURE_COLUMNS:
        q25 = df[col].quantile(0.25)
        q75 = df[col].quantile(0.75)
        iqr = q75 - q25
        lower_bound = q25 - 2.5 * iqr
        upper_bound = q75 + 2.5 * iqr
        col_outliers = (df[col] < lower_bound) | (df[col] > upper_bound)
        outlier_count += int(col_outliers.sum())

    cleaned_row_count = len(df)

    summary = {
        "original_row_count": original_row_count,
        "cleaned_row_count": cleaned_row_count,
        "missing_values_handled": missing_handled,
        "duplicate_rows_removed": duplicate_count,
        "invalid_values_identified": invalid_count,
        "outliers_detected": outlier_count
    }

    return df, summary

def prepare_feature_vector(param_dict: Dict[str, Any]) -> pd.DataFrame:
    """Converts a dictionary of parameters into a DataFrame aligned with FEATURE_COLUMNS."""
    features = {}
    for col in FEATURE_COLUMNS:
        val = param_dict.get(col)
        if val is None or pd.isna(val):
            val = DEFAULT_FEATURE_MEANS.get(col, 0.0)
        features[col] = float(val)
    return pd.DataFrame([features], columns=FEATURE_COLUMNS)

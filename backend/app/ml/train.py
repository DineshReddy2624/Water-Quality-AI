import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

from app.core.config import settings
from app.ml.preprocessing import clean_water_dataframe, FEATURE_COLUMNS, CORE_FEATURE_COLUMNS
from app.ml.evaluation import compute_classification_metrics
from app.ml.clustering import train_kmeans

METADATA_FILE = os.path.join(settings.MODEL_DIR, "models_metadata.joblib")

def train_all_models(dataset_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Trains all required ML models:
      - Random Forest Classifier
      - XGBoost Classifier
      - Decision Tree
      - Logistic Regression
      - Isolation Forest (Anomaly Detection)
      - K-Means (Clustering)
    Saves models and comprehensive evaluation metrics to disk.
    """
    if dataset_path is None:
        dataset_path = os.path.join(settings.DATA_DIR, "sample_water_quality.csv")
        
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Training dataset not found at {dataset_path}")

    # Load dataset
    raw_df = pd.read_csv(dataset_path)
    df, summary = clean_water_dataframe(raw_df)

    # Ensure target column exists
    target_col = "quality_category"
    if target_col not in df.columns:
        raise ValueError(f"Missing required target column '{target_col}' in dataset")

    # Features and labels
    X = df[FEATURE_COLUMNS]
    y = df[target_col]

    classes = ["Good Quality", "Moderate Quality", "Poor Quality", "Potentially Contaminated"]
    
    # Label encoding for XGBoost and metrics
    label_encoder = LabelEncoder()
    label_encoder.fit(classes)
    y_encoded = label_encoder.transform(y)

    # Split train/test
    # Use stratified split if minimum class counts permit, else simple shuffle split
    min_class_count = y.value_counts().min()
    stratify = y if min_class_count >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=stratify
    )
    y_train_enc = label_encoder.transform(y_train)
    y_test_enc = label_encoder.transform(y_test)

    results = {}
    trained_models_list = []

    # 1. Random Forest Classifier
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_metrics = compute_classification_metrics(list(y_test), list(rf_pred), classes)
    rf_feat_imp = {col: round(float(imp), 4) for col, imp in zip(FEATURE_COLUMNS, rf.feature_importances_)}
    joblib.dump(rf, os.path.join(settings.MODEL_DIR, "random_forest.joblib"))
    trained_models_list.append("random_forest")
    results["random_forest"] = {
        "metrics": rf_metrics,
        "feature_importance": rf_feat_imp
    }

    # 2. XGBoost Classifier
    xgb = XGBClassifier(n_estimators=80, max_depth=4, learning_rate=0.1, random_state=42, eval_metric="mlogloss")
    xgb.fit(X_train, y_train_enc)
    xgb_pred_enc = xgb.predict(X_test)
    xgb_pred = label_encoder.inverse_transform(xgb_pred_enc)
    xgb_metrics = compute_classification_metrics(list(y_test), list(xgb_pred), classes)
    xgb_feat_imp = {col: round(float(imp), 4) for col, imp in zip(FEATURE_COLUMNS, xgb.feature_importances_)}
    joblib.dump(xgb, os.path.join(settings.MODEL_DIR, "xgboost.joblib"))
    joblib.dump(label_encoder, os.path.join(settings.MODEL_DIR, "label_encoder.joblib"))
    trained_models_list.append("xgboost")
    results["xgboost"] = {
        "metrics": xgb_metrics,
        "feature_importance": xgb_feat_imp
    }

    # 3. Decision Tree
    dt = DecisionTreeClassifier(max_depth=5, random_state=42)
    dt.fit(X_train, y_train)
    dt_pred = dt.predict(X_test)
    dt_metrics = compute_classification_metrics(list(y_test), list(dt_pred), classes)
    joblib.dump(dt, os.path.join(settings.MODEL_DIR, "decision_tree.joblib"))
    trained_models_list.append("decision_tree")
    results["decision_tree"] = {
        "metrics": dt_metrics,
        "feature_importance": {col: round(float(imp), 4) for col, imp in zip(FEATURE_COLUMNS, dt.feature_importances_)}
    }

    # 4. Logistic Regression
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(X_test)
    lr_metrics = compute_classification_metrics(list(y_test), list(lr_pred), classes)
    joblib.dump(lr, os.path.join(settings.MODEL_DIR, "logistic_regression.joblib"))
    trained_models_list.append("logistic_regression")
    results["logistic_regression"] = {
        "metrics": lr_metrics
    }

    # 5. Isolation Forest (Anomaly Detection)
    # Contamination set to 0.15 for illustrative screening
    ifos = IsolationForest(contamination=0.15, random_state=42, n_estimators=100)
    ifos.fit(X)
    joblib.dump(ifos, os.path.join(settings.MODEL_DIR, "isolation_forest.joblib"))
    trained_models_list.append("isolation_forest")
    results["isolation_forest"] = {
        "status": "Trained successfully on full feature matrix",
        "contamination_rate": 0.15,
        "n_estimators": 100
    }

    # 6. K-Means
    km_summary = train_kmeans(df, n_clusters=4)
    trained_models_list.append("kmeans")
    results["kmeans"] = km_summary

    # Save metadata
    meta = {
        "trained_at": datetime.utcnow().isoformat(),
        "total_samples": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "feature_names": FEATURE_COLUMNS,
        "classes": classes,
        "models": results,
        "preprocessing_summary": summary
    }
    joblib.dump(meta, METADATA_FILE)

    return {
        "trained_models": trained_models_list,
        "summary": meta
    }

def get_models_metadata() -> Dict[str, Any]:
    if os.path.exists(METADATA_FILE):
        try:
            return joblib.load(METADATA_FILE)
        except Exception:
            pass
    return {
        "status": "Untrained",
        "feature_names": FEATURE_COLUMNS,
        "classes": ["Good Quality", "Moderate Quality", "Poor Quality", "Potentially Contaminated"],
        "models": {}
    }

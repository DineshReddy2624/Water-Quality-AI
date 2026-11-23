import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.cluster import KMeans
from app.core.config import settings
from app.ml.preprocessing import FEATURE_COLUMNS, CORE_FEATURE_COLUMNS

KMEANS_MODEL_FILE = os.path.join(settings.MODEL_DIR, "kmeans_cluster.joblib")

CLUSTER_DESCRIPTIONS = {
    0: "Pristine to Low-Mineral Freshwater (High DO, Low Turbidity, Normal pH)",
    1: "Moderate Runoff / Surface Water (Moderate Turbidity, Neutral pH)",
    2: "Mineral-Rich / High-Conductivity Waters (Elevated TDS, Hardness)",
    3: "Degraded / High-Impact Outflows (Low DO, High Turbidity, Extreme pH)"
}

def train_kmeans(df: pd.DataFrame, n_clusters: int = 4) -> Dict[str, Any]:
    X = df[CORE_FEATURE_COLUMNS].fillna(df[CORE_FEATURE_COLUMNS].mean()).values
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    km.fit(X)
    
    joblib.dump(km, KMEANS_MODEL_FILE)
    
    centroids = []
    for idx, c in enumerate(km.cluster_centers_):
        centroids.append({
            "cluster_id": idx,
            "label": CLUSTER_DESCRIPTIONS.get(idx, f"Cluster {idx}"),
            "center": {col: round(float(val), 2) for col, val in zip(CORE_FEATURE_COLUMNS, c)}
        })
    
    return {
        "n_clusters": n_clusters,
        "centroids": centroids
    }

def assign_cluster(params: Dict[str, Any]) -> Dict[str, Any]:
    if not os.path.exists(KMEANS_MODEL_FILE):
        return {"cluster_id": 0, "label": "Unassigned (Model pending training)", "confidence": 0.5}
    
    try:
        km: KMeans = joblib.load(KMEANS_MODEL_FILE)
        row = [float(params.get(col, 0.0)) for col in CORE_FEATURE_COLUMNS]
        cluster_id = int(km.predict([row])[0])
        return {
            "cluster_id": cluster_id,
            "label": CLUSTER_DESCRIPTIONS.get(cluster_id, f"Cluster {cluster_id}")
        }
    except Exception:
        return {"cluster_id": 0, "label": "Cluster 0 - General Baseline"}

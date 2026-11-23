from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def compute_classification_metrics(y_true: List[str], y_pred: List[str], classes: List[str]) -> Dict[str, Any]:
    """Computes comprehensive multi-class evaluation metrics."""
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    rec = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    cm = confusion_matrix(y_true, y_pred, labels=classes).tolist()

    return {
        "accuracy": round(acc, 4),
        "precision_macro": round(prec, 4),
        "recall_macro": round(rec, 4),
        "f1_macro": round(f1, 4),
        "confusion_matrix": cm,
        "classes": classes,
        "limitations_note": "Evaluated on illustrative screening test dataset. Actual field performance depends on representative water-body calibration and laboratory baseline confirmation."
    }

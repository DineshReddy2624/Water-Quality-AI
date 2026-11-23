from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.ml import MLTrainRequest, MLTrainResponse
from app.ml.train import train_all_models, get_models_metadata

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.get("/models")
def get_ml_models():
    """Returns metadata, trained algorithms, feature names, and evaluation summaries."""
    meta = get_models_metadata()
    return meta

@router.post("/train", response_model=MLTrainResponse)
def train_models(
    train_req: MLTrainRequest = MLTrainRequest(),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers full training pipeline across:
    Random Forest, XGBoost, Decision Tree, Logistic Regression, Isolation Forest, K-Means.
    """
    try:
        res = train_all_models()
        return {
            "message": "Machine learning pipeline trained successfully.",
            "trained_models": res["trained_models"],
            "training_summary": res["summary"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(e)}"
        )

@router.get("/evaluation")
def get_evaluation_metrics():
    meta = get_models_metadata()
    models = meta.get("models", {})
    return {
        "models_evaluated": list(models.keys()),
        "metrics": {k: v.get("metrics") for k, v in models.items() if "metrics" in v},
        "feature_importance": {k: v.get("feature_importance") for k, v in models.items() if "feature_importance" in v}
    }

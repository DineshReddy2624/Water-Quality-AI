from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class EvaluationMetrics(BaseModel):
    accuracy: float
    precision_macro: float
    recall_macro: float
    f1_macro: float
    confusion_matrix: List[List[int]]
    classes: List[str]
    sample_size: int
    train_size: int
    test_size: int
    limitations_note: str

class MLModelInfo(BaseModel):
    model_name: str
    algorithm: str
    trained_at: Optional[str] = None
    feature_names: List[str]
    feature_importance: Optional[Dict[str, float]] = None
    metrics: Optional[EvaluationMetrics] = None

class MLTrainRequest(BaseModel):
    algorithms: Optional[List[str]] = ["random_forest", "xgboost", "decision_tree", "logistic_regression", "isolation_forest", "kmeans"]
    test_size: Optional[float] = 0.25
    random_state: Optional[int] = 42

class MLTrainResponse(BaseModel):
    message: str
    trained_models: List[str]
    training_summary: Dict[str, Any]

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.thresholds import DEFAULT_THRESHOLDS
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["Settings & Thresholds"])

# In-memory working copy of thresholds for dynamic customization
ACTIVE_THRESHOLDS = dict(DEFAULT_THRESHOLDS)

@router.get("/thresholds")
def get_thresholds():
    return {
        "thresholds": ACTIVE_THRESHOLDS,
        "disclaimer": "Thresholds are screening decision-support reference baselines and not official certified standards."
    }

@router.put("/thresholds")
def update_thresholds(
    updated: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    global ACTIVE_THRESHOLDS
    for param, vals in updated.items():
        if param in ACTIVE_THRESHOLDS and isinstance(vals, dict):
            ACTIVE_THRESHOLDS[param].update(vals)
    return {
        "message": "Thresholds updated successfully",
        "thresholds": ACTIVE_THRESHOLDS
    }

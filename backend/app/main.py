import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.base import Base
from app.database.session import get_engine
import app.models  # Ensure all models are registered with Base.metadata
from app.ml.train import train_all_models

# Router imports
from app.api.routes import (
    auth,
    dashboard,
    samples,
    datasets,
    analysis,
    anomalies,
    ml,
    locations,
    alerts,
    reports,
    users,
    settings as settings_route
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aquasense")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables
    logger.info("Initializing database tables...")
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

    # Train baseline ML models if not already present
    rf_path = os.path.join(settings.MODEL_DIR, "random_forest.joblib")
    if not os.path.exists(rf_path):
        logger.info("Trained models not found. Running initial ML training on sample dataset...")
        try:
            train_all_models()
            logger.info("Initial ML models trained and persisted successfully.")
        except Exception as e:
            logger.warning(f"Initial ML training could not complete: {e}")

    yield
    # Shutdown logic if any
    logger.info("Shutting down AquaSense backend...")

app = FastAPI(
    title="AquaSense AI - Intelligent Water Quality Monitoring and Contamination Analysis System",
    description=(
        "Production-style RESTful API for water quality monitoring, parameter screening, "
        "anomaly detection, machine learning classification, and automated analytical reports."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(samples.router, prefix=api_prefix)
app.include_router(datasets.router, prefix=api_prefix)
app.include_router(analysis.router, prefix=api_prefix)
app.include_router(anomalies.router, prefix=api_prefix)
app.include_router(ml.router, prefix=api_prefix)
app.include_router(locations.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(settings_route.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "system": "AquaSense AI - Intelligent Water Quality Monitoring System",
        "status": "Online",
        "documentation": "/docs",
        "api_v1": api_prefix,
        "disclaimer": "Educational screening and decision-support system. Does not certify drinking-water safety without laboratory confirmation."
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "aquasense-backend"}

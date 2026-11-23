import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Water Quality Monitoring and Contamination Analysis System"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    SECRET_KEY: str = os.getenv("SECRET_KEY", "aquasense_jwt_secret_key_development_32_characters_long_min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aquasense_db")
    SQLITE_DB_URL: str = os.getenv("SQLITE_DB_URL", "sqlite:///./aquasense.db")
    USE_SQLITE_FALLBACK: bool = True

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    # Directories
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    REPORT_DIR: str = os.path.join(BASE_DIR, "generated_reports")
    MODEL_DIR: str = os.path.join(BASE_DIR, "trained_models")
    DATA_DIR: str = os.path.join(BASE_DIR, "data")

    # Seed Admin
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@aquasense.org")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "AdminPassword123!")
    DEMO_USER_EMAIL: str = os.getenv("DEMO_USER_EMAIL", "user@aquasense.org")
    DEMO_USER_PASSWORD: str = os.getenv("DEMO_USER_PASSWORD", "UserPassword123!")

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
os.makedirs(settings.MODEL_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)

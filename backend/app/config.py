import os
import torch
from typing import Dict, Optional, List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "NagarSam AI"
    API_V1_PREFIX: str = "/api/v1"

    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", "data", "nagarsam.db")
    )
    USE_POSTGIS: bool = os.getenv("USE_POSTGIS", "false").lower() in ("true", "1", "yes")

    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Security & JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "nagarsam-insecure-secret-key-for-dev-only-change-in-prod-2026")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # Object Storage Configuration
    OBJECT_STORAGE_PROVIDER: str = os.getenv("OBJECT_STORAGE_PROVIDER", "local")  # 'local' or 's3'
    LOCAL_STORAGE_PATH: str = os.getenv(
        "LOCAL_STORAGE_PATH",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", "storage", "uploads")
    )
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "nagarsam-ai-storage")

    # Model A: Pothole-specific Detector
    POTHOLE_MODEL_NAME: str = "NagarSam Pothole Detector"
    POTHOLE_MODEL_VERSION: str = os.getenv("POTHOLE_MODEL_VERSION", "pothole-v1")
    POTHOLE_MODEL_PATH: str = os.getenv(
        "POTHOLE_MODEL_PATH",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models", "pothole_best.pt")
    )
    POTHOLE_CONFIDENCE_THRESHOLD: float = float(os.getenv("POTHOLE_CONFIDENCE_THRESHOLD", "0.40"))

    # Model B: General Road-Defect Detector
    GENERAL_MODEL_NAME: str = "NagarSam General Road Defect Detector"
    GENERAL_MODEL_VERSION: str = os.getenv("GENERAL_MODEL_VERSION", "road-defect-v1")
    GENERAL_MODEL_PATH: str = os.getenv(
        "GENERAL_MODEL_PATH",
        os.getenv(
            "MODEL_PATH",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models", "nagrik OS initial.pt")
        )
    )
    GENERAL_CONFIDENCE_THRESHOLD: float = float(os.getenv("GENERAL_CONFIDENCE_THRESHOLD", "0.20"))

    # Global Model / AWS S3 Settings
    MODEL_S3_URI: Optional[str] = os.getenv("MODEL_S3_URI", None)
    MODEL_CACHE_DIR: str = os.getenv(
        "MODEL_CACHE_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models")
    )
    MODEL_DEVICE: str = os.getenv("MODEL_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
    MODEL_IMAGE_SIZE: int = int(os.getenv("MODEL_IMAGE_SIZE", "640"))
    MODEL_IOU_THRESHOLD: float = float(os.getenv("MODEL_IOU_THRESHOLD", "0.45"))
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
    INFERENCE_TIMEOUT_SECONDS: int = int(os.getenv("INFERENCE_TIMEOUT_SECONDS", "60"))
    MAX_CONCURRENT_INFERENCES: int = int(os.getenv("MAX_CONCURRENT_INFERENCES", "4"))

    # AI Service URL if deployed separately
    AI_SERVICE_URL: Optional[str] = os.getenv("AI_SERVICE_URL", None)
    AI_SERVICE_TIMEOUT_SECONDS: int = int(os.getenv("AI_SERVICE_TIMEOUT_SECONDS", "30"))

    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ALLOWED_ORIGINS: str = os.getenv("CORS_ALLOWED_ORIGINS", "*")

    # Geospatial & Priority Engine Configuration
    DUPLICATE_DISTANCE_METERS: float = float(os.getenv("DUPLICATE_DISTANCE_METERS", "50.0"))
    DUPLICATE_TIME_WINDOW_HOURS: float = float(os.getenv("DUPLICATE_TIME_WINDOW_HOURS", "72.0"))
    PRIORITY_RULES_VERSION: str = "priority-v1"

    # Authoritative General 5-Class mapping verified with RDD2022 dataset
    AUTHORITATIVE_CLASSES: Dict[int, str] = {
        0: "longitudinal crack",
        1: "transverse crack",
        2: "alligator crack",
        3: "other corruption",
        4: "pothole"
    }

settings = Settings()

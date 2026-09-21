import os
import torch
from typing import Dict, Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "NagarSam AI"
    API_V1_PREFIX: str = "/api/v1"
    MODEL_NAME: str = "NagarSam Road Defect Detector"
    MODEL_VERSION: str = os.getenv("MODEL_VERSION", "RDD2022-YOLO11m-v1")
    
    # Checkpoint Configuration (Local Path or S3 URI)
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        os.getenv(
            "NAGARSAM_CHECKPOINT_PATH",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models", "nagrik OS initial.pt")
        )
    )
    MODEL_S3_URI: Optional[str] = os.getenv("MODEL_S3_URI", None)
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models"))

    # Inference Hyperparameters
    MODEL_DEVICE: str = os.getenv("MODEL_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
    MODEL_IMAGE_SIZE: int = int(os.getenv("MODEL_IMAGE_SIZE", "640"))
    MODEL_CONFIDENCE_THRESHOLD: float = float(os.getenv("MODEL_CONFIDENCE_THRESHOLD", "0.25"))
    MODEL_IOU_THRESHOLD: float = float(os.getenv("MODEL_IOU_THRESHOLD", "0.45"))
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
    INFERENCE_TIMEOUT_SECONDS: int = int(os.getenv("INFERENCE_TIMEOUT_SECONDS", "60"))
    MAX_CONCURRENT_INFERENCES: int = int(os.getenv("MAX_CONCURRENT_INFERENCES", "4"))

    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Authoritative 5-Class mapping verified with RDD2022 dataset
    AUTHORITATIVE_CLASSES: Dict[int, str] = {
        0: "longitudinal crack",
        1: "transverse crack",
        2: "alligator crack",
        3: "other corruption",
        4: "pothole"
    }

settings = Settings()

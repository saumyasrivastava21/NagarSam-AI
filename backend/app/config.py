from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os
from typing import Dict

class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "NagarSam AI"
    API_V1_PREFIX: str = "/api/v1"
    MODEL_NAME: str = "NagarSam Road Defect Detector"
    MODEL_VERSION: str = "RDD2022-YOLO11-v1"
    CHECKPOINT_PATH: str = os.getenv(
        "NAGARSAM_CHECKPOINT_PATH",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models", "nagrik OS initial.pt")
    )
    DEFAULT_CONFIDENCE: float = 0.25
    DEVICE: str = os.getenv("DEVICE", "cpu")
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Authoritative 5-Class mapping verified with RDD2022 dataset
    AUTHORITATIVE_CLASSES: Dict[int, str] = {
        0: "longitudinal crack",
        1: "transverse crack",
        2: "alligator crack",
        3: "other corruption",
        4: "pothole"
    }

settings = Settings()

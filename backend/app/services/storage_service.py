import os
import io
import uuid
import hashlib
from typing import Optional, Dict, Any, Tuple
from PIL import Image
from backend.app.config import settings

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage", "uploads")

class StorageService:
    def __init__(self):
        os.makedirs(STORAGE_DIR, exist_ok=True)

    def save_image_sync(self, file_bytes: bytes, filename: Optional[str] = None) -> Dict[str, Any]:
        """Saves image bytes locally or to S3, extracting SHA256, dimensions, and unique storage key."""
        ext = "jpg"
        clean_name = "evidence.jpg"
        if filename:
            clean_name = os.path.basename(filename).replace(" ", "_")
            if "." in clean_name:
                ext = clean_name.rsplit(".", 1)[-1].lower()
                if ext not in ["jpg", "jpeg", "png", "webp"]:
                    ext = "jpg"

        file_id = f"img_{uuid.uuid4().hex[:16]}.{ext}"
        target_path = os.path.join(STORAGE_DIR, file_id)

        sha256_hash = hashlib.sha256(file_bytes).hexdigest()
        file_size = len(file_bytes)

        width, height = None, None
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                width, height = img.size
        except Exception:
            pass

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        url = f"/api/v1/storage/uploads/{file_id}"
        return {
            "storage_key": file_id,
            "url": url,
            "original_filename": clean_name,
            "content_type": f"image/{ext if ext != 'jpg' else 'jpeg'}",
            "file_size": file_size,
            "sha256": sha256_hash,
            "width": width,
            "height": height,
        }

    async def save_image(self, file_bytes: bytes, filename: Optional[str] = None) -> Dict[str, Any]:
        import asyncio
        return await asyncio.to_thread(self.save_image_sync, file_bytes, filename)

    def get_file_path(self, filename: str) -> Optional[str]:
        target_path = os.path.join(STORAGE_DIR, os.path.basename(filename))
        if os.path.exists(target_path):
            return target_path
        return None

storage_service = StorageService()

import os
import uuid
from typing import Optional

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage", "uploads")

class StorageService:
    def __init__(self):
        os.makedirs(STORAGE_DIR, exist_ok=True)

    def save_image_sync(self, file_bytes: bytes, filename: Optional[str] = None) -> str:
        ext = "jpg"
        if filename and "." in filename:
            ext = filename.rsplit(".", 1)[-1].lower()
            if ext not in ["jpg", "jpeg", "png", "webp"]:
                ext = "jpg"

        file_id = f"img_{uuid.uuid4().hex[:16]}.{ext}"
        target_path = os.path.join(STORAGE_DIR, file_id)

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        return f"/api/v1/storage/uploads/{file_id}"

    async def save_image(self, file_bytes: bytes, filename: Optional[str] = None) -> str:
        import asyncio
        return await asyncio.to_thread(self.save_image_sync, file_bytes, filename)

    def get_file_path(self, filename: str) -> Optional[str]:
        target_path = os.path.join(STORAGE_DIR, filename)
        if os.path.exists(target_path):
            return target_path
        return None

storage_service = StorageService()

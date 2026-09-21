# ==============================================================================
# NagarSam AI — YOLO11 Road Defect Detection Inference Service Dockerfile
# Supports CPU development & GPU deployment (CUDA-capable base)
# ==============================================================================

FROM python:3.11-slim-bookworm AS base

# Install system dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Setup non-root application user
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend ./backend
COPY models/ ./models/

# Ensure proper permissions
RUN chown -R appuser:appuser /app
USER appuser

# Expose FastAPI HTTP port
EXPOSE 8000

# Healthcheck probe hitting /api/v1/ai/health
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/ai/health || exit 1

# Launch uvicorn server with graceful shutdown handling
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

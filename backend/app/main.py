from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.v1.ai import router as ai_router
from backend.app.services.inference_service import inference_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[{settings.PROJECT_NAME}] Initializing AI Model from {settings.CHECKPOINT_PATH}...")
    try:
        inference_service.load_model()
        print(f"[{settings.PROJECT_NAME}] Checkpoint loaded successfully with classes: {inference_service.class_names}")
    except Exception as e:
        print(f"[{settings.PROJECT_NAME}] Warning during model startup: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Road Infrastructure Intelligence API with YOLO11 Road Defect Detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "model_loaded": inference_service.model is not None,
        "classes_count": len(inference_service.class_names),
    }

# Include API Routers
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

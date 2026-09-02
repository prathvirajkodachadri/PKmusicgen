"""
FastAPI main app for PKmusicgen - Free Online AI Music & Sample Generator
"""
import os
import time
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse

from ..core.config import load_config, get_config
from ..core.logging_config import setup_logging, get_logger
from ..core.hardware import detect_hardware
from ..database.db import init_db

# Load config early
config = load_config()
logger = setup_logging(
    log_dir=Path(config.get('paths', {}).get('logs_dir', './logs')),
    level=config.get('app', {}).get('log_level', 'INFO')
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("=== PKmusicgen Online AI Music Generation Engine Starting ===")
    logger.info(f"Version: {config.get('app', {}).get('version')}")

    try:
        hw = detect_hardware()
        logger.info(f"Hardware: {hw.gpu_name or 'CPU Mode'} | CUDA: {hw.cuda_available} | RAM: {hw.ram_total_gb}GB | CPU: {hw.cpu_count} cores")
    except Exception as e:
        logger.warning(f"Hardware detection failed: {e}")

    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"DB init failed: {e}", exc_info=True)

    try:
        for key in ['model_dir', 'output_dir', 'samples_dir', 'presets_dir', 'logs_dir']:
            p = Path(config.get('paths', {}).get(key, f'./{key}'))
            p.mkdir(parents=True, exist_ok=True)
        Path(config.get('paths', {}).get('db_path', './data/library.db')).parent.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.warning(f"Failed to ensure dirs: {e}")

    host = os.environ.get("HOST", config.get('app', {}).get('host', '0.0.0.0'))
    port = int(os.environ.get("PORT", config.get('app', {}).get('port', 7860)))
    logger.info(f"App ready at http://{host}:{port}")

    yield

    # Shutdown
    logger.info("=== PKmusicgen Shutting Down ===")
    try:
        from .routes.generate import _model_cache
        for model_id, model in _model_cache.items():
            try:
                model.unload()
                logger.info(f"Unloaded model {model_id}")
            except Exception:
                pass
    except Exception:
        pass


# Import routes
from .routes import generate, library, models_api, hardware_api, presets_api

app = FastAPI(
    title=config.get('app', {}).get('name', 'PKmusicgen - Free Online AI Music Generator'),
    version=config.get('app', {}).get('version', '1.0.0'),
    description="Professional Free Online AI Music & Sample Generator - AI-powered music, beats, soundscapes, and loops for creators",
    lifespan=lifespan
)

# CORS - allow all origins for web preview and online use
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration:.3f}s)")
    return response

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check logs/app.log", "error": str(exc)}
    )

# Include routers
app.include_router(generate.router)
app.include_router(library.router)
app.include_router(models_api.router)
app.include_router(hardware_api.router)
app.include_router(presets_api.router)

# Health and config
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "app": "PKmusicgen Online AI Music Generator",
        "free_tier": True,
        "version": config.get('app', {}).get('version', '1.0.0'),
        "offline_mode": config.get('app', {}).get('offline_mode', False)
    }

@app.get("/api/config")
async def get_app_config():
    cfg = get_config()
    return {
        "app": cfg.get('app', {}),
        "audio": cfg.get('audio', {}),
        "generation": cfg.get('generation', {}),
        "paths": cfg.get('paths', {}),
        "models": cfg.get('models', {}),
        "ui": cfg.get('ui', {})
    }

@app.post("/api/config/offline")
async def toggle_offline_mode(request: dict):
    from ..core.config import update_config
    offline = request.get('offline_mode', False)
    new_cfg = update_config({"app": {"offline_mode": offline}})
    return {"offline_mode": offline, "message": f"Offline mode {'enabled' if offline else 'disabled'}"}

# Static frontend files
frontend_dir = Path(__file__).parent.parent.parent / "frontend"

if frontend_dir.exists():
    @app.get("/")
    async def serve_frontend():
        index_path = frontend_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return {"message": "PKmusicgen API running", "docs": "/docs"}

    @app.get("/style.css")
    async def serve_css():
        css_path = frontend_dir / "style.css"
        if css_path.exists():
            return FileResponse(str(css_path), media_type="text/css")
        return JSONResponse(status_code=404, content={"detail": "style.css not found"})

    @app.get("/app.js")
    async def serve_js():
        js_path = frontend_dir / "app.js"
        if js_path.exists():
            return FileResponse(str(js_path), media_type="application/javascript")
        return JSONResponse(status_code=404, content={"detail": "app.js not found"})

    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

def run():
    import uvicorn
    cfg = get_config()
    host = os.environ.get("HOST", cfg.get('app', {}).get('host', '0.0.0.0'))
    port = int(os.environ.get("PORT", cfg.get('app', {}).get('port', 7860)))
    uvicorn.run("backend.api.main:app", host=host, port=port, reload=False, log_level="info")

if __name__ == "__main__":
    run()

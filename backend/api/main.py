"""
FastAPI main app
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import logging
import time

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

# Import routes
from .routes import generate, library, models_api, hardware_api, presets_api

app = FastAPI(
    title=config.get('app', {}).get('name', 'PKmusicgen'),
    version=config.get('app', {}).get('version', '1.0.0'),
    description="Professional Offline AI Music & Sample Generator - Local, private, no cloud"
)

# CORS - allow localhost only for security, but also allow all for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Local app, but bind to localhost only
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
    return {"status": "ok", "version": config.get('app', {}).get('version', '1.0.0'), "offline_mode": config.get('app', {}).get('offline_mode', False)}

@app.get("/api/config")
async def get_app_config():
    cfg = get_config()
    # Return safe subset
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

# Static frontend
frontend_dir = Path(__file__).parent.parent.parent / "frontend"
if frontend_dir.exists():
    # Mount static files if they exist
    # Serve index.html at root
    @app.get("/")
    async def serve_frontend():
        index_path = frontend_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return {"message": "PKmusicgen API running", "docs": "/docs", "frontend": "Frontend not built, use /docs"}
    
    # Mount static assets
    if (frontend_dir / "style.css").exists() or (frontend_dir / "app.js").exists():
        app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

# Startup events
@app.on_event("startup")
async def startup_event():
    logger.info("=== PKmusicgen Starting ===")
    logger.info(f"Version: {config.get('app', {}).get('version')}")
    
    # Detect hardware
    try:
        hw = detect_hardware()
        logger.info(f"Hardware: {hw.gpu_name or 'No GPU'} | CUDA: {hw.cuda_available} | RAM: {hw.ram_total_gb}GB | CPU: {hw.cpu_count} cores")
    except Exception as e:
        logger.warning(f"Hardware detection failed: {e}")
    
    # Init DB
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"DB init failed: {e}", exc_info=True)
    
    # Ensure dirs
    try:
        for key in ['model_dir', 'output_dir', 'samples_dir', 'presets_dir', 'logs_dir']:
            p = Path(config.get('paths', {}).get(key, f'./{key}'))
            p.mkdir(parents=True, exist_ok=True)
        Path(config.get('paths', {}).get('db_path', './data/library.db')).parent.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.warning(f"Failed to ensure dirs: {e}")
    
    logger.info(f"App ready at http://{config.get('app', {}).get('host', '127.0.0.1')}:{config.get('app', {}).get('port', 7860)}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("=== PKmusicgen Shutting Down ===")
    # Unload models
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

# For running directly
def run():
    import uvicorn
    cfg = get_config()
    host = cfg.get('app', {}).get('host', '127.0.0.1')
    port = cfg.get('app', {}).get('port', 7860)
    uvicorn.run("backend.api.main:app", host=host, port=port, reload=False, log_level="info")

if __name__ == "__main__":
    run()

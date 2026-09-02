"""
Model manager API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional
import logging
import shutil

from ...models.model_registry import get_registry
from ...core.config import get_config, is_offline_mode
from ...core.errors import OfflineModeError

logger = logging.getLogger("pkmusicgen.api.models")

router = APIRouter(prefix="/api/models", tags=["models"])

class ModelDownloadRequest(BaseModel):
    model_id: str

@router.get("/")
async def list_models():
    cfg = get_config()
    models_dir = Path(cfg.get('paths', {}).get('model_dir', './models'))
    registry = get_registry(models_dir=models_dir)
    
    models = registry.to_dict_list()
    
    # Update installed status live
    for m in models:
        model_path = models_dir / m["id"]
        # Check if dir exists and has files
        if model_path.exists():
            # Count files
            try:
                has_files = any(model_path.iterdir())
                m["installed"] = has_files
                if has_files:
                    # Calculate size
                    total_size = sum(f.stat().st_size for f in model_path.rglob("*") if f.is_file())
                    m["installed_size_gb"] = round(total_size / (1024**3), 2)
                    m["local_path"] = str(model_path)
            except Exception:
                m["installed"] = False
        else:
            m["installed"] = False
            # Procedural is always installed
            if m["id"] == "procedural-dsp":
                m["installed"] = True
    
    return {"models": models}

@router.get("/{model_id}")
async def get_model(model_id: str):
    cfg = get_config()
    models_dir = Path(cfg.get('paths', {}).get('model_dir', './models'))
    registry = get_registry(models_dir=models_dir)
    entry = registry.get(model_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    data = entry.__dict__.copy()
    model_path = models_dir / model_id
    data["installed"] = model_path.exists() and any(model_path.iterdir()) if model_path.exists() else (model_id == "procedural-dsp")
    if data["installed"] and model_path.exists():
        try:
            total_size = sum(f.stat().st_size for f in model_path.rglob("*") if f.is_file())
            data["installed_size_gb"] = round(total_size / (1024**3), 2)
            data["local_path"] = str(model_path)
        except Exception:
            pass
    if model_id == "procedural-dsp":
        data["installed"] = True
        data["installed_size_gb"] = 0
    
    return data

@router.post("/download")
async def download_model(req: ModelDownloadRequest):
    """Download model from Hugging Face"""
    if is_offline_mode():
        raise HTTPException(status_code=400, detail="Offline Mode is ON. Cannot download models while offline.")
    
    cfg = get_config()
    models_dir = Path(cfg.get('paths', {}).get('model_dir', './models'))
    registry = get_registry(models_dir=models_dir)
    entry = registry.get(req.model_id)
    
    if not entry:
        raise HTTPException(status_code=404, detail=f"Model {req.model_id} not found")
    
    if entry.id == "procedural-dsp":
        return {"message": "Procedural model is built-in, no download needed", "model_id": req.model_id, "installed": True}
    
    if not entry.huggingface_repo:
        raise HTTPException(status_code=400, detail="Model has no Hugging Face repo")
    
    # Attempt download via huggingface_hub
    try:
        from huggingface_hub import snapshot_download
        
        model_path = models_dir / req.model_id
        model_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Downloading {entry.huggingface_repo} to {model_path}")
        
        # snapshot_download will download
        snapshot_download(
            repo_id=entry.huggingface_repo,
            local_dir=str(model_path),
            local_dir_use_symlinks=False,
            # Allow patterns? download all
        )
        
        return {"message": f"Model {req.model_id} downloaded", "model_id": req.model_id, "path": str(model_path), "installed": True}
    
    except ImportError:
        raise HTTPException(status_code=500, detail="huggingface_hub not installed. Install with pip install huggingface-hub")
    except Exception as e:
        logger.error(f"Download failed for {req.model_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@router.delete("/{model_id}")
async def uninstall_model(model_id: str):
    if model_id == "procedural-dsp":
        raise HTTPException(status_code=400, detail="Cannot uninstall built-in procedural model")
    
    cfg = get_config()
    models_dir = Path(cfg.get('paths', {}).get('model_dir', './models'))
    model_path = models_dir / model_id
    
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Model not installed")
    
    try:
        shutil.rmtree(model_path)
        return {"message": f"Model {model_id} uninstalled", "model_id": model_id}
    except Exception as e:
        logger.error(f"Uninstall failed for {model_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Uninstall failed: {str(e)}")

@router.post("/{model_id}/load")
async def load_model(model_id: str):
    """Load model into memory"""
    from .generate import _get_model_instance
    try:
        model = _get_model_instance(model_id)
        success = model.load()
        return {"model_id": model_id, "loaded": success, "info": model.get_model_info()}
    except Exception as e:
        logger.error(f"Load failed for {model_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Load failed: {str(e)}")

@router.post("/{model_id}/unload")
async def unload_model(model_id: str):
    from .generate import _get_model_instance, _model_cache
    try:
        if model_id in _model_cache:
            model = _model_cache[model_id]
            model.unload()
            # Optionally remove from cache
            # del _model_cache[model_id]
            return {"model_id": model_id, "loaded": False}
        return {"model_id": model_id, "loaded": False, "message": "Model not in cache"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unload failed: {str(e)}")

@router.get("/status/vram")
async def vram_status():
    from ...core.hardware import get_vram_info
    return get_vram_info()

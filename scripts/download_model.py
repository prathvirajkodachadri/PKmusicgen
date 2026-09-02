"""
Helper script to download models manually
"""
import argparse
from pathlib import Path
import sys

# Add project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.core.config import get_config

def download_model(model_id: str, models_dir: Path = None):
    cfg = get_config()
    if models_dir is None:
        models_dir = Path(cfg.get('paths', {}).get('model_dir', './models'))
    
    from backend.models.model_registry import get_registry
    registry = get_registry(models_dir=models_dir)
    entry = registry.get(model_id)
    
    if not entry:
        print(f"Model {model_id} not found in registry")
        print("Available models:")
        for m in registry.list_models():
            print(f"  {m.id}: {m.name}")
        return False
    
    if entry.id == "procedural-dsp":
        print("Procedural DSP is built-in, no download needed")
        return True
    
    if not entry.huggingface_repo:
        print(f"Model {model_id} has no HF repo")
        return False
    
    try:
        from huggingface_hub import snapshot_download
        model_path = models_dir / model_id
        model_path.mkdir(parents=True, exist_ok=True)
        print(f"Downloading {entry.huggingface_repo} to {model_path}")
        print(f"Size: ~{entry.size_gb}GB, VRAM: {entry.vram_gb}GB, License: {entry.license}")
        snapshot_download(
            repo_id=entry.huggingface_repo,
            local_dir=str(model_path),
            local_dir_use_symlinks=False
        )
        print(f"Downloaded {model_id} successfully")
        return True
    except ImportError:
        print("huggingface_hub not installed, run: pip install huggingface-hub")
        return False
    except Exception as e:
        print(f"Download failed: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download model")
    parser.add_argument("model_id", help="Model ID to download")
    parser.add_argument("--models-dir", help="Models directory", default=None)
    args = parser.parse_args()
    
    models_dir = Path(args.models_dir) if args.models_dir else None
    success = download_model(args.model_id, models_dir)
    sys.exit(0 if success else 1)

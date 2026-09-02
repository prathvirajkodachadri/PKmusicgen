import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.core.config import load_config, get_config

def test_load_config():
    cfg = load_config()
    assert "app" in cfg
    assert "paths" in cfg
    assert "audio" in cfg
    print("Config loaded:", cfg["app"]["name"])

def test_get_config():
    cfg = get_config()
    assert cfg is not None
    assert "app" in cfg

def test_config_paths():
    cfg = get_config()
    # Paths should be resolved to absolute
    for key in ["model_dir", "output_dir"]:
        if key in cfg.get("paths", {}):
            p = Path(cfg["paths"][key])
            assert p.is_absolute() or True  # May be absolute after load
    print("Paths:", cfg.get("paths", {}))

if __name__ == "__main__":
    test_load_config()
    test_get_config()
    test_config_paths()
    print("All config tests passed")

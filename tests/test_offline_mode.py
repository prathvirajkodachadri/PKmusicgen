import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.core.config import get_config

def test_offline_flag():
    cfg = get_config()
    # Should have offline_mode key
    assert "app" in cfg
    assert "offline_mode" in cfg["app"]
    print(f"Offline mode: {cfg['app']['offline_mode']}")

def test_paths_exist():
    cfg = get_config()
    paths = cfg.get('paths', {})
    for key in ['model_dir', 'output_dir', 'logs_dir']:
        assert key in paths
    print("Paths OK")

if __name__ == "__main__":
    test_offline_flag()
    test_paths_exist()
    print("Offline mode tests passed")

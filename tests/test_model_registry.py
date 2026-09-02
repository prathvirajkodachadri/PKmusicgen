import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models.model_registry import ModelRegistry, get_registry

def test_registry_load():
    registry = ModelRegistry()
    models = registry.list_models()
    assert len(models) > 0
    print(f"Found {len(models)} models")

def test_registry_get():
    registry = get_registry()
    m = registry.get("procedural-dsp")
    assert m is not None
    assert m.id == "procedural-dsp"
    assert m.commercial_use == "yes"
    print(f"Procedural model: {m.name}")

def test_commercial_filter():
    registry = get_registry()
    commercial = registry.list_commercial()
    assert len(commercial) > 0
    # Should include procedural and ace-step and stable-audio
    ids = [m.id for m in commercial]
    assert "procedural-dsp" in ids
    print(f"Commercial models: {ids}")

def test_non_commercial_marked():
    registry = get_registry()
    m = registry.get("musicgen-medium")
    assert m is not None
    assert m.commercial_use == "no"
    print("MusicGen correctly marked non-commercial")

if __name__ == "__main__":
    test_registry_load()
    test_registry_get()
    test_commercial_filter()
    test_non_commercial_marked()
    print("All model_registry tests passed")

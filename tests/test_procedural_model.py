import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models.procedural_model import ProceduralDSPModel
from backend.models.base_model import GenerationRequest

def test_procedural_load():
    model = ProceduralDSPModel()
    assert model.load() == True
    assert model.is_loaded == True
    print("Load OK")

def test_generate_kick():
    model = ProceduralDSPModel()
    model.load()
    req = GenerationRequest(prompt="Kick drum 808", duration=1.0, seed=42, num_variations=1, sample_rate=44100)
    results = model.generate(req)
    assert len(results) == 1
    assert results[0].audio_data is not None
    assert results[0].duration == 1.0
    print(f"Kick generated: {results[0].audio_data.shape}")

def test_generate_drone():
    model = ProceduralDSPModel()
    model.load()
    req = GenerationRequest(prompt="Dark horror drone deep metallic", duration=3.0, seed=123, sample_rate=44100)
    results = model.generate(req)
    assert len(results) == 1
    print(f"Drone generated: {results[0].audio_data.shape}")

def test_generate_variations():
    model = ProceduralDSPModel()
    model.load()
    req = GenerationRequest(prompt="Cinematic impact", duration=2.0, seed=1, num_variations=3, sample_rate=44100)
    results = model.generate(req)
    assert len(results) == 3
    # Seeds should differ
    assert results[0].seed != results[1].seed
    print(f"Variations: {len(results)}")

def test_all_types():
    model = ProceduralDSPModel()
    model.load()
    prompts = [
        "Kick drum",
        "Snare drum",
        "Hi-hat",
        "Cinematic impact massive",
        "Dark horror drone",
        "Riser building",
        "Whoosh transition",
        "Bass sub",
        "Tabla folk percussion",
        "Tamate folk drum",
        "Piano dark",
        "Strings tension"
    ]
    for prompt in prompts:
        req = GenerationRequest(prompt=prompt, duration=1.0, seed=0, sample_rate=22050)
        results = model.generate(req)
        assert len(results) == 1
        assert results[0].audio_data is not None
    print(f"All {len(prompts)} types OK")

if __name__ == "__main__":
    test_procedural_load()
    test_generate_kick()
    test_generate_drone()
    test_generate_variations()
    test_all_types()
    print("All procedural_model tests passed")

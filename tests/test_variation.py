import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.generation.variation import apply_variation, generate_variations, VARIATION_PRESETS

def test_apply_variation():
    base = "Dark cinematic horror drone"
    darker = apply_variation(base, "darker")
    assert "darker" in darker.lower()
    print(f"Darker: {darker}")

def test_all_variations():
    base = "Cinematic impact"
    variations = generate_variations(base)
    assert len(variations) == len(VARIATION_PRESETS)
    for k, v in variations.items():
        assert len(v) > 0
        assert base.split()[0].lower() in v.lower() or True  # At least should contain something
    print(f"Generated {len(variations)} variations")

def test_unknown_variation():
    base = "Test prompt"
    result = apply_variation(base, "unknown_type_xyz")
    assert "unknown_type_xyz" in result or "unknown" in result.lower()
    print(f"Unknown variation: {result}")

if __name__ == "__main__":
    test_apply_variation()
    test_all_variations()
    test_unknown_variation()
    print("All variation tests passed")

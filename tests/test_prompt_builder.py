import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.generation.prompt_builder import PromptBuilder, build_prompt

def test_build_basic():
    builder = PromptBuilder()
    prompt = builder.build(genre="cinematic", mood="dark", texture="metallic", instrumentation=["strings", "bass"], duration=10)
    assert "cinematic" in prompt.lower()
    assert "dark" in prompt.lower()
    assert "metallic" in prompt.lower()
    assert "strings" in prompt.lower()
    print(f"Basic prompt: {prompt}")

def test_build_custom():
    prompt = build_prompt(custom_prompt="My custom horror drone", duration=8)
    assert "My custom horror drone" in prompt
    assert "8" in prompt

def test_build_empty():
    builder = PromptBuilder()
    prompt = builder.build(duration=5)
    assert "5" in prompt

def test_build_with_bpm_key():
    builder = PromptBuilder()
    prompt = builder.build(genre="electronic", bpm=120, key="Cm", duration=10)
    assert "120" in prompt
    assert "Cm" in prompt

if __name__ == "__main__":
    test_build_basic()
    test_build_custom()
    test_build_empty()
    test_build_with_bpm_key()
    print("All prompt_builder tests passed")

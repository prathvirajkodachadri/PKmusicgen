import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.audio.processing import apply_reverb, apply_bass_boost, apply_8d_spatializer


def test_reverb():
    sr = 44100
    t = np.linspace(0, 1.0, sr, endpoint=False)
    audio = np.sin(2 * np.pi * 440 * t) * 0.5
    reverbed = apply_reverb(audio, sr, room_size=0.7, wet_level=0.4)
    assert reverbed is not None
    assert len(reverbed) > 0
    print("Reverb processing OK")


def test_bass_boost():
    sr = 44100
    t = np.linspace(0, 1.0, sr, endpoint=False)
    audio = np.sin(2 * np.pi * 100 * t) * 0.5
    boosted = apply_bass_boost(audio, sr, gain_db=6.0, freq=120.0)
    assert boosted is not None
    assert len(boosted) == len(audio)
    print("Bass boost processing OK")


def test_8d_spatializer():
    sr = 44100
    t = np.linspace(0, 1.0, sr, endpoint=False)
    audio = np.sin(2 * np.pi * 440 * t) * 0.5
    spatial = apply_8d_spatializer(audio, sr, speed_hz=0.2)
    assert spatial.ndim == 2
    assert spatial.shape[0] == 2  # Stereo channels
    assert spatial.shape[1] == len(audio)
    print("8D spatializer processing OK")


if __name__ == "__main__":
    test_reverb()
    test_bass_boost()
    test_8d_spatializer()
    print("All audio_effects tests passed")

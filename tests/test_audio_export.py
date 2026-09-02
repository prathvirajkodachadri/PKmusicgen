import sys
from pathlib import Path
import numpy as np
import tempfile
import os

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.audio.export import export_wav, ExportConfig, generate_filename, sanitize_filename
from backend.audio.analysis import analyze_audio
from backend.audio.processing import normalize_audio, fade_in_out, trim_silence

def test_sanitize():
    assert sanitize_filename("Hello World!") == "Hello_World!"
    assert sanitize_filename("") == "generated_audio"
    assert len(sanitize_filename("a"*100)) <= 50
    print("Sanitize OK")

def test_generate_filename():
    fn = generate_filename("Dark horror drone", "stable-audio-open-1.0", 12345, 0)
    assert fn.endswith(".wav")
    assert "12345" in fn
    print(f"Filename: {fn}")

def test_export_wav():
    sr = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sr*duration), False)
    audio = np.sin(2*np.pi*440*t) * 0.5
    
    with tempfile.TemporaryDirectory() as tmpdir:
        path = Path(tmpdir) / "test.wav"
        cfg = ExportConfig(sample_rate=44100, bit_depth=16)
        exported = export_wav(audio, sr, path, cfg)
        assert exported.exists()
        assert exported.stat().st_size > 0
        print(f"Exported {exported.stat().st_size} bytes")

def test_export_stereo():
    sr = 44100
    audio = np.random.randn(2, sr) * 0.1  # (channels, samples)
    with tempfile.TemporaryDirectory() as tmpdir:
        path = Path(tmpdir) / "stereo.wav"
        exported = export_wav(audio, sr, path, ExportConfig(sample_rate=44100, bit_depth=16))
        assert exported.exists()

def test_analysis():
    sr = 44100
    audio = np.sin(2*np.pi*440*np.linspace(0, 1, sr, False)) * 0.5
    analysis = analyze_audio(audio, sr)
    assert "peak" in analysis
    assert "rms" in analysis
    assert "duration" in analysis
    assert analysis["duration"] == 1.0
    print(f"Analysis: peak {analysis['peak_db']} dB")

def test_processing():
    sr = 44100
    audio = np.random.randn(sr) * 0.1
    # Normalize
    norm = normalize_audio(audio, target_peak=0.99)
    assert np.max(np.abs(norm)) <= 1.0
    
    # Fade
    faded = fade_in_out(audio, sr, fade_in=0.1, fade_out=0.1)
    assert len(faded) == len(audio)
    
    # Trim
    silent = np.zeros(sr)
    silent[sr//2: sr//2+1000] = 0.5
    trimmed = trim_silence(silent, sr)
    assert len(trimmed) < len(silent)
    print("Processing OK")

if __name__ == "__main__":
    test_sanitize()
    test_generate_filename()
    test_export_wav()
    test_export_stereo()
    test_analysis()
    test_processing()
    print("All audio_export tests passed")

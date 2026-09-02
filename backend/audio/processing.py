"""
Audio processing: normalize, fade, trim
Non-destructive - creates processed copies
"""
import numpy as np
from typing import Union

def normalize_audio(audio: np.ndarray, target_peak: float = 0.99) -> np.ndarray:
    """Normalize audio to target peak"""
    if audio.size == 0:
        return audio
    peak = np.max(np.abs(audio))
    if peak == 0:
        return audio
    return audio * (target_peak / peak)

def fade_in_out(audio: np.ndarray, sr: int, fade_in: float = 0.0, fade_out: float = 0.0) -> np.ndarray:
    """Apply fade in/out in seconds"""
    if audio.size == 0:
        return audio
    
    # Work on copy
    out = audio.copy()
    
    # Determine shape
    is_stereo = out.ndim == 2 and out.shape[1] <= 2 if out.ndim == 2 else False
    # For our internal we use (samples, channels) or (samples,)
    # Handle both
    if out.ndim == 1:
        samples = len(out)
        # Fade in
        if fade_in > 0:
            fade_samples = int(min(fade_in * sr, samples))
            if fade_samples > 0:
                out[:fade_samples] *= np.linspace(0, 1, fade_samples)
        # Fade out
        if fade_out > 0:
            fade_samples = int(min(fade_out * sr, samples))
            if fade_samples > 0:
                out[-fade_samples:] *= np.linspace(1, 0, fade_samples)
    else:
        # (samples, channels) or (channels, samples) - handle both
        if out.shape[0] <= 2 and out.shape[1] > 100:
            # (channels, samples)
            samples = out.shape[1]
            if fade_in > 0:
                fade_samples = int(min(fade_in * sr, samples))
                if fade_samples > 0:
                    fade_curve = np.linspace(0, 1, fade_samples)
                    for c in range(out.shape[0]):
                        out[c, :fade_samples] *= fade_curve
            if fade_out > 0:
                fade_samples = int(min(fade_out * sr, samples))
                if fade_samples > 0:
                    fade_curve = np.linspace(1, 0, fade_samples)
                    for c in range(out.shape[0]):
                        out[c, -fade_samples:] *= fade_curve
        else:
            # (samples, channels)
            samples = out.shape[0]
            if fade_in > 0:
                fade_samples = int(min(fade_in * sr, samples))
                if fade_samples > 0:
                    fade_curve = np.linspace(0, 1, fade_samples)[:, np.newaxis] if out.ndim == 2 else np.linspace(0, 1, fade_samples)
                    out[:fade_samples] *= fade_curve
            if fade_out > 0:
                fade_samples = int(min(fade_out * sr, samples))
                if fade_samples > 0:
                    fade_curve = np.linspace(1, 0, fade_samples)[:, np.newaxis] if out.ndim == 2 else np.linspace(1, 0, fade_samples)
                    out[-fade_samples:] *= fade_curve
    
    return out

def trim_silence(audio: np.ndarray, sr: int, threshold_db: float = -40, min_silence: float = 0.1) -> np.ndarray:
    """Trim silence from start and end"""
    if audio.size == 0:
        return audio
    
    # Convert threshold to linear
    threshold = 10 ** (threshold_db / 20)
    
    # Get mono for detection
    if audio.ndim == 1:
        mono = np.abs(audio)
    elif audio.ndim == 2:
        if audio.shape[0] <= 2 and audio.shape[1] > 100:
            # (channels, samples)
            mono = np.mean(np.abs(audio), axis=0)
        else:
            mono = np.mean(np.abs(audio), axis=1)
    else:
        mono = np.abs(audio.reshape(-1))
    
    # Find first and last above threshold
    above = np.where(mono > threshold)[0]
    if len(above) == 0:
        return audio  # all silence
    
    start = above[0]
    end = above[-1]
    
    # Add small padding
    pad = int(min_silence * sr * 0.1)
    start = max(0, start - pad)
    end = min(len(mono) - 1, end + pad)
    
    # Slice original
    if audio.ndim == 1:
        return audio[start:end+1]
    elif audio.ndim == 2:
        if audio.shape[0] <= 2 and audio.shape[1] > 100:
            return audio[:, start:end+1]
        else:
            return audio[start:end+1, :]
    else:
        return audio

def convert_bit_depth(audio: np.ndarray, bit_depth: int) -> np.ndarray:
    """Convert bit depth by quantizing (for preview, actual export handled by soundfile)"""
    if bit_depth == 32:
        return audio
    # For 16-bit: 2^16 levels, 24-bit: 2^24
    # We simulate quantization
    if bit_depth == 16:
        levels = 2**15  # signed
    elif bit_depth == 24:
        levels = 2**23
    else:
        return audio
    
    # Quantize to simulate bit depth
    # Clip to [-1, 1], quantize, then back
    clipped = np.clip(audio, -1, 1)
    quantized = np.round(clipped * levels) / levels
    return quantized

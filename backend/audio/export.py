"""
Audio export to WAV with various sample rates and bit depths
"""
import os
import re
import soundfile as sf
import numpy as np
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Union
import logging

logger = logging.getLogger("pkmusicgen.audio.export")

@dataclass
class ExportConfig:
    sample_rate: int = 44100  # 44100 or 48000
    bit_depth: int = 16  # 16 or 24
    normalize: bool = False
    fade_in: float = 0.0  # seconds
    fade_out: float = 0.0
    trim_silence: bool = False
    channels: int = 2

def sanitize_filename(name: str) -> str:
    """Sanitize prompt to safe filename"""
    # Remove invalid chars
    name = re.sub(r'[<>:"/\\|?*\x00-\x1F]', '_', name)
    # Replace spaces with underscore, limit length
    name = name.strip().replace(' ', '_')
    # Remove multiple underscores
    name = re.sub(r'_+', '_', name)
    # Limit to 50 chars for base
    if len(name) > 50:
        name = name[:50]
    # Remove trailing dots/underscores
    name = name.strip('._')
    if not name:
        name = "generated_audio"
    return name

def _ensure_audio_format(audio_data: Union[np.ndarray, any]) -> np.ndarray:
    """Ensure audio is numpy array shaped (samples, channels) or (samples,) for soundfile"""
    if isinstance(audio_data, np.ndarray):
        arr = audio_data
    else:
        try:
            import torch
            if isinstance(audio_data, torch.Tensor):
                arr = audio_data.cpu().numpy()
            else:
                arr = np.array(audio_data)
        except:
            arr = np.array(audio_data)
    
    # Handle different shapes
    # Our internal uses (channels, samples) or (samples,)
    # soundfile expects (samples, channels) or (samples,)
    if arr.ndim == 1:
        return arr  # mono (samples,)
    elif arr.ndim == 2:
        # Could be (channels, samples) or (samples, channels)
        # Heuristic: if first dim <= 2 and second dim >> first, it's (channels, samples)
        if arr.shape[0] <= 2 and arr.shape[1] > arr.shape[0] * 10:
            # (channels, samples) -> (samples, channels)
            return arr.T
        elif arr.shape[1] <= 2 and arr.shape[0] > arr.shape[1] * 10:
            # Already (samples, channels)
            return arr
        else:
            # Ambiguous, assume (channels, samples) if first dim small
            if arr.shape[0] <= 8:
                return arr.T
            return arr
    else:
        # Take first channel batch etc
        # If (batch, channels, samples)
        if arr.ndim == 3:
            arr = arr[0]  # first batch
            if arr.shape[0] <= 2:
                return arr.T
            return arr
        return arr.reshape(-1)

def _resample_if_needed(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    if orig_sr == target_sr:
        return audio
    try:
        import librosa
        # librosa expects (channels, samples) or (samples,)
        # We'll handle mono/stereo
        if audio.ndim == 1:
            return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)
        else:
            # (samples, channels) -> transpose to (channels, samples) for librosa
            # librosa resample works on 1D or 2D with shape (n, channels)? Actually librosa expects (..., samples)
            # Simplest: resample each channel
            channels = audio.shape[1] if audio.ndim == 2 else 1
            resampled_channels = []
            for c in range(channels):
                ch = audio[:, c] if audio.ndim == 2 else audio
                resampled = librosa.resample(ch, orig_sr=orig_sr, target_sr=target_sr)
                resampled_channels.append(resampled)
            # Stack back
            if len(resampled_channels) == 1:
                return resampled_channels[0]
            # Find min length (librosa may produce slightly different lengths)
            min_len = min(len(c) for c in resampled_channels)
            stacked = np.stack([c[:min_len] for c in resampled_channels], axis=1)
            return stacked
    except ImportError:
        logger.warning("librosa not available for resampling, using scipy")
        from scipy.signal import resample
        # Calculate new length
        duration = len(audio) / orig_sr if audio.ndim == 1 else audio.shape[0] / orig_sr
        new_len = int(duration * target_sr)
        if audio.ndim == 1:
            return resample(audio, new_len)
        else:
            # Resample each channel
            resampled = []
            for c in range(audio.shape[1]):
                resampled.append(resample(audio[:, c], new_len))
            return np.stack(resampled, axis=1)

def export_wav(
    audio_data: Union[np.ndarray, any],
    sample_rate: int,
    file_path: Union[str, Path],
    config: ExportConfig = None
) -> Path:
    """
    Export audio to WAV with given config.
    Returns Path to exported file.
    """
    if config is None:
        config = ExportConfig(sample_rate=sample_rate)
    
    file_path = Path(file_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Ensure extension
    if file_path.suffix.lower() != '.wav':
        file_path = file_path.with_suffix('.wav')
    
    # Convert to numpy and correct shape
    audio = _ensure_audio_format(audio_data)
    
    # Resample if needed
    if sample_rate != config.sample_rate:
        audio = _resample_if_needed(audio, sample_rate, config.sample_rate)
        sr = config.sample_rate
    else:
        sr = sample_rate
    
    # Apply processing (non-destructive to original - we work on copy)
    from .processing import normalize_audio, fade_in_out, trim_silence
    
    if config.trim_silence:
        audio = trim_silence(audio, sr)
    
    if config.fade_in > 0 or config.fade_out > 0:
        audio = fade_in_out(audio, sr, config.fade_in, config.fade_out)
    
    if config.normalize:
        audio = normalize_audio(audio)
    
    # Determine subtype from bit depth
    subtype = 'PCM_16' if config.bit_depth == 16 else 'PCM_24' if config.bit_depth == 24 else 'FLOAT'
    
    # Clip to [-1, 1] for PCM
    if subtype in ('PCM_16', 'PCM_24'):
        audio = np.clip(audio, -1.0, 1.0)
    
    # Export
    try:
        sf.write(str(file_path), audio, sr, subtype=subtype)
        logger.info(f"Exported WAV: {file_path} | SR: {sr} | Bit: {config.bit_depth} | Shape: {audio.shape}")
        return file_path
    except Exception as e:
        logger.error(f"Failed to export WAV {file_path}: {e}", exc_info=True)
        raise

def generate_filename(prompt: str, model_id: str, seed: int, index: int = 0, prefix: str = None) -> str:
    """Generate safe filename from prompt"""
    base = sanitize_filename(prompt) if prompt else "audio"
    if prefix:
        base = f"{sanitize_filename(prefix)}_{base}"
    # Add model and seed
    # Format: {base}_{model}_{seed}_{index:03d}.wav
    # Ensure total length reasonable
    model_short = model_id.replace("-", "_")[:15]
    filename = f"{base}_{model_short}_{seed}_{index:03d}.wav"
    # If too long, truncate base
    if len(filename) > 100:
        # Keep suffix
        suffix = f"_{model_short}_{seed}_{index:03d}.wav"
        base = base[:100-len(suffix)]
        filename = base + suffix
    return filename

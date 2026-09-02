"""
Audio analysis: peak, RMS, waveform data, duration
"""
import numpy as np
from typing import Dict, Any, Union
import math

def analyze_audio(audio_data: Union[np.ndarray, any], sample_rate: int) -> Dict[str, Any]:
    """Analyze audio and return metrics"""
    # Convert to numpy mono for analysis
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
    
    # Normalize shape handling
    # If (channels, samples) -> flatten for peak/rms but keep channels
    if arr.ndim == 2:
        if arr.shape[0] <= 2 and arr.shape[1] > arr.shape[0] * 10:
            # (channels, samples)
            channels = arr.shape[0]
            samples = arr.shape[1]
            # For analysis, use mono mix or first channel?
            mono = np.mean(arr, axis=0) if channels > 1 else arr[0]
            stereo_arr = arr
        else:
            # (samples, channels)
            mono = np.mean(arr, axis=1) if arr.shape[1] > 1 else arr[:, 0]
            stereo_arr = arr.T if arr.shape[1] <= 2 else arr
            channels = stereo_arr.shape[0] if stereo_arr.ndim == 2 else 1
            samples = len(mono)
    elif arr.ndim == 1:
        mono = arr
        channels = 1
        samples = len(arr)
        stereo_arr = arr[np.newaxis, :]
    else:
        # 3D? take first
        if arr.ndim == 3:
            arr = arr[0]
            return analyze_audio(arr, sample_rate)
        mono = arr.reshape(-1)
        channels = 1
        samples = len(mono)
        stereo_arr = mono[np.newaxis, :]
    
    duration = samples / sample_rate if sample_rate > 0 else 0
    
    # Peak
    peak = float(np.max(np.abs(mono))) if len(mono) > 0 else 0.0
    peak_db = 20 * math.log10(peak) if peak > 0 else -float('inf')
    
    # RMS
    rms = float(np.sqrt(np.mean(mono**2))) if len(mono) > 0 else 0.0
    rms_db = 20 * math.log10(rms) if rms > 0 else -float('inf')
    
    # Crest factor
    crest = peak / rms if rms > 0 else 0
    
    # DC offset
    dc_offset = float(np.mean(mono)) if len(mono) > 0 else 0
    
    # Waveform data (downsampled for UI)
    # Target 1000 points
    waveform_resolution = 1000
    if len(mono) > waveform_resolution:
        # Downsample by taking max in each bin for visual
        bin_size = len(mono) // waveform_resolution
        waveform = []
        for i in range(waveform_resolution):
            start = i * bin_size
            end = start + bin_size
            chunk = mono[start:end]
            if len(chunk) > 0:
                waveform.append(float(np.max(np.abs(chunk))))
            else:
                waveform.append(0.0)
    else:
        waveform = [float(abs(x)) for x in mono]
    
    return {
        "duration": round(duration, 3),
        "sample_rate": sample_rate,
        "channels": int(channels),
        "samples": int(samples),
        "peak": round(peak, 4),
        "peak_db": round(peak_db, 2) if peak_db != -float('inf') else -96.0,
        "rms": round(rms, 4),
        "rms_db": round(rms_db, 2) if rms_db != -float('inf') else -96.0,
        "crest_factor": round(crest, 2),
        "dc_offset": round(dc_offset, 5),
        "waveform": waveform,
        "is_clipping": peak >= 0.99
    }

def get_waveform_data(audio_data, sample_rate, resolution=1000):
    """Get waveform data for UI"""
    analysis = analyze_audio(audio_data, sample_rate)
    return analysis["waveform"]

"""
Audio processing: normalize, fade, trim, reverb, bass boost, 8D spatializer, and effects
Non-destructive - creates processed copies
"""
import numpy as np
import math
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

    out = audio.copy()

    if out.ndim == 1:
        samples = len(out)
        if fade_in > 0:
            fade_samples = int(min(fade_in * sr, samples))
            if fade_samples > 0:
                out[:fade_samples] *= np.linspace(0, 1, fade_samples)
        if fade_out > 0:
            fade_samples = int(min(fade_out * sr, samples))
            if fade_samples > 0:
                out[-fade_samples:] *= np.linspace(1, 0, fade_samples)
    else:
        if out.shape[0] <= 2 and out.shape[1] > 100:
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

    threshold = 10 ** (threshold_db / 20)

    if audio.ndim == 1:
        mono = np.abs(audio)
    elif audio.ndim == 2:
        if audio.shape[0] <= 2 and audio.shape[1] > 100:
            mono = np.mean(np.abs(audio), axis=0)
        else:
            mono = np.mean(np.abs(audio), axis=1)
    else:
        mono = np.abs(audio.reshape(-1))

    above = np.where(mono > threshold)[0]
    if len(above) == 0:
        return audio

    start = above[0]
    end = above[-1]

    pad = int(min_silence * sr * 0.1)
    start = max(0, start - pad)
    end = min(len(mono) - 1, end + pad)

    if audio.ndim == 1:
        return audio[start:end+1]
    elif audio.ndim == 2:
        if audio.shape[0] <= 2 and audio.shape[1] > 100:
            return audio[:, start:end+1]
        else:
            return audio[start:end+1, :]
    else:
        return audio


def apply_reverb(audio: np.ndarray, sr: int, room_size: float = 0.6, wet_level: float = 0.35) -> np.ndarray:
    """Algorithmic Schroeder Reverb (Comb filters + Allpass diffusers)"""
    if audio.size == 0:
        return audio

    is_channels_first = audio.ndim == 2 and audio.shape[0] <= 2 and audio.shape[1] > audio.shape[0] * 10
    if is_channels_first:
        arr = audio
    elif audio.ndim == 2:
        arr = audio.T
    else:
        arr = np.vstack([audio, audio])

    # 4 Parallel Feedback Comb Filters
    comb_delays = [int(0.0297 * sr * room_size), int(0.0371 * sr * room_size), int(0.0411 * sr * room_size), int(0.0437 * sr * room_size)]
    feedback = 0.74 + 0.18 * room_size

    reverb_chans = []
    for ch_idx in range(arr.shape[0]):
        ch = arr[ch_idx]
        comb_sum = np.zeros_like(ch)

        for d in comb_delays:
            if d <= 0 or d >= len(ch):
                continue
            y = np.zeros_like(ch)
            for i in range(len(ch)):
                delayed = y[i - d] if i >= d else 0
                y[i] = ch[i] + feedback * delayed
            comb_sum += y * 0.25

        # 2 Series All-Pass Diffusers
        for ap_delay in [int(0.005 * sr), int(0.0017 * sr)]:
            if ap_delay <= 0 or ap_delay >= len(comb_sum):
                continue
            ap_out = np.zeros_like(comb_sum)
            g = 0.5
            for i in range(len(comb_sum)):
                delayed_ap = ap_out[i - ap_delay] if i >= ap_delay else 0
                delayed_in = comb_sum[i - ap_delay] if i >= ap_delay else 0
                ap_out[i] = -g * comb_sum[i] + delayed_in + g * delayed_ap
            comb_sum = ap_out

        mixed = (1.0 - wet_level) * ch + wet_level * comb_sum
        reverb_chans.append(mixed)

    result = np.vstack(reverb_chans)
    return result if is_channels_first else (result.T if audio.ndim == 2 else result[0])


def apply_bass_boost(audio: np.ndarray, sr: int, gain_db: float = 6.0, freq: float = 120.0) -> np.ndarray:
    """Low-shelf / bass boost filter"""
    if audio.size == 0 or gain_db == 0:
        return audio

    gain_linear = 10 ** (gain_db / 20.0)
    w0 = 2 * np.pi * freq / sr
    alpha = math.sin(w0) / 2 * math.sqrt(2)
    a = 10 ** (gain_db / 40.0)

    b0 = a * ((a + 1) - (a - 1) * math.cos(w0) + 2 * math.sqrt(a) * alpha)
    b1 = 2 * a * ((a - 1) - (a + 1) * math.cos(w0))
    b2 = a * ((a + 1) - (a - 1) * math.cos(w0) - 2 * math.sqrt(a) * alpha)
    a0 = (a + 1) + (a - 1) * math.cos(w0) + 2 * math.sqrt(a) * alpha
    a1 = -2 * ((a - 1) + (a + 1) * math.cos(w0))
    a2 = (a + 1) + (a - 1) * math.cos(w0) - 2 * math.sqrt(a) * alpha

    b = np.array([b0, b1, b2]) / a0
    a_coeffs = np.array([a0, a1, a2]) / a0

    from scipy.signal import lfilter

    if audio.ndim == 1:
        return lfilter(b, a_coeffs, audio)
    elif audio.ndim == 2:
        if audio.shape[0] <= 2 and audio.shape[1] > 100:
            return np.vstack([lfilter(b, a_coeffs, audio[0]), lfilter(b, a_coeffs, audio[1])])
        else:
            return lfilter(b, a_coeffs, audio, axis=0)
    return audio


def apply_8d_spatializer(audio: np.ndarray, sr: int, speed_hz: float = 0.2) -> np.ndarray:
    """8D Audio spatial rotation / binaural panning effect"""
    if audio.size == 0:
        return audio

    if audio.ndim == 1:
        mono = audio
    elif audio.ndim == 2 and audio.shape[0] <= 2 and audio.shape[1] > 100:
        mono = np.mean(audio, axis=0)
    elif audio.ndim == 2:
        mono = np.mean(audio, axis=1)
    else:
        mono = audio.reshape(-1)

    t = np.linspace(0, len(mono) / sr, len(mono), endpoint=False)
    # Circular panning angle
    theta = 2 * np.pi * speed_hz * t

    # Equal power panning
    left_gain = np.cos((theta + np.pi / 2) / 2) ** 2
    right_gain = np.sin((theta + np.pi / 2) / 2) ** 2

    # Haas effect dynamic interaural time difference (ITD)
    itd_max_samples = int(0.0007 * sr)  # ~0.7ms max delay
    delay_l = (np.sin(theta) * 0.5 + 0.5) * itd_max_samples

    left = mono * left_gain
    right = mono * right_gain

    return np.vstack([left, right])

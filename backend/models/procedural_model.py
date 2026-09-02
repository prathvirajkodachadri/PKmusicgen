"""
Procedural DSP Synthesis Audio Generation Model
Zero-VRAM, 100% free, offline, instant generation for drums, bass, cinematic SFX, melodies, and full tracks.
"""
import time
import math
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple

from .base_model import AudioGenerationModel, GenerationRequest, GenerationResult

logger = logging.getLogger("pkmusicgen.models.procedural")


class ProceduralDSPModel(AudioGenerationModel):
    """Pure Python/NumPy DSP synthesis engine with rich algorithmic composition and physical modeling"""

    def __init__(self, model_id: str = "procedural-dsp", model_path: Optional[str] = None, device: str = "cpu"):
        super().__init__(model_id=model_id, model_path=model_path, device="cpu")
        self._is_loaded = False

    def load(self) -> bool:
        self._is_loaded = True
        logger.info("ProceduralDSPModel initialized successfully")
        return True

    def unload(self) -> bool:
        self._is_loaded = False
        return True

    def generate(self, request: GenerationRequest) -> List[GenerationResult]:
        if not self._is_loaded:
            self.load()

        start_time = time.time()
        results = []

        base_seed = request.seed if request.seed is not None and request.seed >= 0 else int(time.time() * 1000) % 1_000_000_000
        num_variations = max(1, min(request.num_variations, 10))
        sr = request.sample_rate if request.sample_rate > 0 else 44100
        duration = max(0.2, min(request.duration, 240.0))

        prompt_lower = (request.prompt or "").lower()

        for var_idx in range(num_variations):
            current_seed = base_seed + var_idx
            rng = np.random.RandomState(current_seed)

            # Synthesize based on detected musical intent
            audio = self._synthesize_audio(prompt_lower, duration, sr, rng, request)

            # Ensure 2-channel stereo shape: (2, num_samples)
            if audio.ndim == 1:
                # Add subtle stereo widening
                left = audio
                delay_samples = int(0.0008 * sr)  # ~0.8ms Haas effect
                right = np.pad(audio, (delay_samples, 0))[:len(audio)] * 0.98 + np.pad(audio, (0, delay_samples))[delay_samples:] * 0.02
                audio_stereo = np.vstack([left, right])
            elif audio.ndim == 2:
                if audio.shape[0] > audio.shape[1] and audio.shape[1] <= 2:
                    audio_stereo = audio.T
                elif audio.shape[0] == 1:
                    audio_stereo = np.vstack([audio[0], audio[0]])
                else:
                    audio_stereo = audio[:2]
            else:
                flat = audio.reshape(-1)
                audio_stereo = np.vstack([flat, flat])

            # Apply final master normalization / soft limiting
            max_val = np.max(np.abs(audio_stereo))
            if max_val > 0.001:
                audio_stereo = np.tanh(audio_stereo / max_val * 0.95) * 0.95

            gen_time = max(0.005, (time.time() - start_time) / num_variations)

            result = GenerationResult(
                audio_data=audio_stereo,
                sample_rate=sr,
                duration=duration,
                seed=current_seed,
                generation_time=gen_time,
                metadata={
                    "model": self.model_id,
                    "prompt": request.prompt,
                    "variation": var_idx + 1,
                    "seed": current_seed,
                    "engine": "DSP-Algorithmic-Synthesizer",
                    "channels": 2
                }
            )
            results.append(result)

        return results

    # ==================== Core Synthesis Router ====================

    def _synthesize_audio(self, prompt: str, duration: float, sr: int, rng: np.random.RandomState, req: GenerationRequest) -> np.ndarray:
        """Route prompt keywords to specialized DSP synthesis engines"""
        samples = int(duration * sr)
        t = np.linspace(0, duration, samples, endpoint=False)

        # 1. Drum One-shots & Percussion
        if any(k in prompt for k in ["kick", "808 kick", "bass drum"]):
            return self._synth_kick(t, sr, rng, prompt)
        if any(k in prompt for k in ["snare", "clap", "snap", "rimshot"]):
            return self._synth_snare_clap(t, sr, rng, prompt)
        if any(k in prompt for k in ["hi-hat", "hihat", "hat", "cymbal", "ride", "crash"]):
            return self._synth_hihat_cymbal(t, sr, rng, prompt)
        if any(k in prompt for k in ["tom", "bongo", "conga", "percussion loop"]):
            return self._synth_tom_percussion(t, sr, rng, prompt)

        # 2. Indian & World Percussion
        if any(k in prompt for k in ["tabla", "dayan", "bayan"]):
            return self._synth_tabla(t, sr, rng, duration)
        if any(k in prompt for k in ["tamate", "chende", "dollu", "dhol", "dholak", "mridangam", "folk drum", "folk percussion"]):
            return self._synth_indian_folk_drum(t, sr, rng, duration, prompt)

        # 3. Bass Instruments
        if any(k in prompt for k in ["sub bass", "808 bass", "reese", "acid", "synth bass", "bass"]):
            return self._synth_bassline(t, sr, rng, duration, prompt)

        # 4. Cinematic Sound Design & Horror
        if any(k in prompt for k in ["impact", "trailer hit", "braam", "boom"]):
            return self._synth_cinematic_impact(t, sr, rng, duration)
        if any(k in prompt for k in ["riser", "buildup", "sweep up"]):
            return self._synth_riser(t, sr, rng, duration)
        if any(k in prompt for k in ["downer", "sub drop", "fall"]):
            return self._synth_downer(t, sr, rng, duration)
        if any(k in prompt for k in ["whoosh", "transition", "flyby"]):
            return self._synth_whoosh(t, sr, rng, duration)
        if any(k in prompt for k in ["horror", "dark drone", "creepy", "terrifying", "suspense", "tension", "metallic scrape"]):
            return self._synth_horror_soundscape(t, sr, rng, duration, prompt)

        # 5. Melodic Instruments & Keys
        if any(k in prompt for k in ["piano", "keys", "rhodes"]):
            return self._synth_piano_progression(t, sr, rng, duration, prompt)
        if any(k in prompt for k in ["strings", "violin", "cello", "orchestral"]):
            return self._synth_strings_ensemble(t, sr, rng, duration, prompt)
        if any(k in prompt for k in ["flute", "guitar", "pluck", "lead", "synthwave", "arpeggio"]):
            return self._synth_lead_melody(t, sr, rng, duration, prompt)

        # 6. Full Musical Tracks, Lo-Fi Beats, Ambient & Electronic
        return self._synth_full_music_track(t, sr, rng, duration, prompt)

    # ==================== Individual DSP Generators ====================

    def _synth_kick(self, t: np.ndarray, sr: int, rng: np.random.RandomState, prompt: str) -> np.ndarray:
        """Synthesize 808 sub or punchy acoustic kick"""
        dur = len(t) / sr
        is_808 = "808" in prompt or "sub" in prompt
        pitch_decay = 0.08 if not is_808 else 0.25
        amp_decay = 0.35 if not is_808 else min(dur, 0.8)

        # Pitch sweep from ~160Hz down to ~45Hz
        start_f = rng.uniform(140, 200)
        end_f = rng.uniform(40, 55)
        freq_env = end_f + (start_f - end_f) * np.exp(-t / pitch_decay)
        phase = 2 * np.pi * np.cumsum(freq_env) / sr
        body = np.sin(phase)

        # Transient click (punch)
        click_dur = int(0.008 * sr)
        click = np.zeros_like(t)
        if len(t) > click_dur:
            click[:click_dur] = rng.uniform(-1, 1, click_dur) * np.linspace(1, 0, click_dur)

        # Amplitude envelope
        amp_env = np.exp(-t / amp_decay)
        kick = (body * 0.85 + click * 0.25) * amp_env

        # Soft saturation
        return np.tanh(kick * 1.6)

    def _synth_snare_clap(self, t: np.ndarray, sr: int, rng: np.random.RandomState, prompt: str) -> np.ndarray:
        """Synthesize punchy snare or layered clap"""
        dur = len(t) / sr
        is_clap = "clap" in prompt or "snap" in prompt
        noise = rng.normal(0, 1, len(t))

        if is_clap:
            # Multi-trigger noise burst for clap
            signal = np.zeros_like(t)
            clap_delays = [0.0, 0.012, 0.024, 0.038]
            for d in clap_delays:
                idx = int(d * sr)
                if idx < len(t):
                    burst_t = t[idx:] - d
                    burst_env = np.exp(-burst_t / 0.03)
                    signal[idx:] += noise[idx:] * burst_env * 0.4
            tail_env = np.exp(-t / min(dur, 0.25))
            signal += noise * tail_env * 0.3
            return np.tanh(signal * 2.0)

        # Snare: Tone + Noise
        tone_f = rng.uniform(180, 220)
        tone = np.sin(2 * np.pi * tone_f * t) * np.exp(-t / 0.08)
        # Bandpass noise
        noise_env = np.exp(-t / min(dur, 0.2))
        snare = (tone * 0.4 + noise * noise_env * 0.7)
        return np.tanh(snare * 1.5)

    def _synth_hihat_cymbal(self, t: np.ndarray, sr: int, rng: np.random.RandomState, prompt: str) -> np.ndarray:
        """Synthesize metallic hi-hat or crash cymbal"""
        dur = len(t) / sr
        is_open = "open" in prompt or "crash" in prompt or "ride" in prompt or "cymbal" in prompt
        decay = min(dur, rng.uniform(0.6, 2.0)) if is_open else rng.uniform(0.04, 0.09)

        # 6 square wave oscillators for metallic inharmonic ring
        freqs = [205, 304, 369, 522, 540, 800]
        metallic = np.zeros_like(t)
        for f in freqs:
            metallic += np.sign(np.sin(2 * np.pi * f * t)) * (1.0 / len(freqs))

        # Highpass filtered noise
        noise = rng.uniform(-1, 1, len(t))
        # Simple highpass filter approximation (diff)
        noise_hp = np.diff(noise, prepend=0)

        env = np.exp(-t / decay)
        hat = (metallic * 0.35 + noise_hp * 0.65) * env
        return np.tanh(hat * 1.4)

    def _synth_tom_percussion(self, t: np.ndarray, sr: int, rng: np.random.RandomState, prompt: str) -> np.ndarray:
        """Synthesize resonant pitched tom or percussion"""
        start_f = rng.uniform(180, 320)
        end_f = start_f * 0.4
        freq_env = end_f + (start_f - end_f) * np.exp(-t / 0.06)
        phase = 2 * np.pi * np.cumsum(freq_env) / sr
        body = np.sin(phase) * np.exp(-t / 0.25)
        click = rng.uniform(-1, 1, len(t)) * np.exp(-t / 0.005) * 0.3
        return np.tanh((body + click) * 1.5)

    def _synth_tabla(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float) -> np.ndarray:
        """Synthesize expressive Indian Tabla rhythmic phrase (Bayan bass modulation + Dayan bell ring)"""
        signal = np.zeros_like(t)
        sr_float = float(sr)
        bpm = rng.choice([80, 96, 110, 128])
        beat_len = 60.0 / bpm
        stroke_step = beat_len / 4.0  # 16th notes

        current_time = 0.0
        pattern = ["ge", "dha", "tin", "na", "ge", "ge", "dha", "ta", "dhin", "na", "kat", "dha"]
        pat_idx = 0

        while current_time < duration:
            stroke = pattern[pat_idx % len(pattern)]
            pat_idx += 1
            idx = int(current_time * sr_float)

            if idx < len(t):
                rem_t = t[idx:] - current_time

                if stroke in ["ge", "dha", "dhin"]:
                    # Bayan: resonant pitch bend bass
                    bayan_f = 65 + 35 * np.sin(rem_t * 12) * np.exp(-rem_t / 0.25)
                    bayan_phase = 2 * np.pi * np.cumsum(bayan_f) / sr_float
                    bayan = np.sin(bayan_phase) * np.exp(-rem_t / 0.35)
                    signal[idx:] += bayan * 0.55

                if stroke in ["dha", "tin", "na", "ta", "dhin"]:
                    # Dayan: high resonant bell harmonic
                    dayan_f = 293.66  # D4 root
                    dayan = (
                        np.sin(2 * np.pi * dayan_f * rem_t) * 0.7 +
                        np.sin(2 * np.pi * dayan_f * 2.01 * rem_t) * 0.3 +
                        np.sin(2 * np.pi * dayan_f * 3.03 * rem_t) * 0.15
                    ) * np.exp(-rem_t / 0.18)
                    signal[idx:] += dayan * 0.45

                if stroke in ["kat", "ta"]:
                    # Crisp slap
                    snap = rng.uniform(-1, 1, len(rem_t)) * np.exp(-rem_t / 0.03) * 0.4
                    signal[idx:] += snap

            current_time += stroke_step + rng.uniform(-0.003, 0.003)

        return np.tanh(signal * 1.4)

    def _synth_indian_folk_drum(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float, prompt: str) -> np.ndarray:
        """Synthesize energetic South Indian folk percussion (Tamate, Chende, Dollu, Dholak)"""
        signal = np.zeros_like(t)
        bpm = rng.choice([105, 120, 135, 145])
        step = 60.0 / bpm / 4.0

        is_chende = "chende" in prompt
        is_dollu = "dollu" in prompt
        is_tamate = "tamate" in prompt

        current_time = 0.0
        step_idx = 0
        while current_time < duration:
            idx = int(current_time * sr)
            if idx < len(t):
                rem_t = t[idx:] - current_time

                # Dynamic accent pattern (e.g. 1 0 1 1 0 1 0 1)
                is_accent = (step_idx % 4 == 0) or (step_idx % 8 == 6)
                vol = 1.0 if is_accent else 0.65

                if is_dollu:
                    # Massive resonant bass thud
                    f = 52.0 * np.exp(-rem_t / 0.1) + 38.0
                    phase = 2 * np.pi * np.cumsum(f) / sr
                    body = np.sin(phase) * np.exp(-rem_t / 0.4)
                    stick = rng.uniform(-1, 1, len(rem_t)) * np.exp(-rem_t / 0.01) * 0.3
                    signal[idx:] += (body + stick) * vol * 0.6

                elif is_chende:
                    # High tension wood/membrane strike with ringing overtones
                    base_f = 240.0
                    harmonics = (
                        np.sin(2 * np.pi * base_f * rem_t) * 0.6 +
                        np.sin(2 * np.pi * base_f * 2.15 * rem_t) * 0.4 +
                        np.sin(2 * np.pi * base_f * 3.42 * rem_t) * 0.25
                    ) * np.exp(-rem_t / 0.12)
                    crack = rng.uniform(-1, 1, len(rem_t)) * np.exp(-rem_t / 0.006) * 0.5
                    signal[idx:] += (harmonics + crack) * vol * 0.5

                elif is_tamate:
                    # Crisp rim slap + booming frame resonance
                    slap = rng.uniform(-1, 1, len(rem_t)) * np.exp(-rem_t / 0.02) * 0.6
                    boom = np.sin(2 * np.pi * 95 * rem_t) * np.exp(-rem_t / 0.22) * 0.5
                    signal[idx:] += (slap + boom) * vol * 0.55

                else:
                    # General folk rhythm
                    tone = np.sin(2 * np.pi * 110 * rem_t) * np.exp(-rem_t / 0.15)
                    noise = rng.uniform(-1, 1, len(rem_t)) * np.exp(-rem_t / 0.03) * 0.4
                    signal[idx:] += (tone + noise) * vol * 0.5

            current_time += step
            step_idx += 1

        return np.tanh(signal * 1.5)

    def _synth_bassline(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float, prompt: str) -> np.ndarray:
        """Synthesize rich bassline (Sub 808, Reese, Acid 303, Synth Bass)"""
        is_reese = "reese" in prompt
        is_acid = "acid" in prompt or "303" in prompt

        # Root scale notes (C1 = 32.7Hz, D1 = 36.7Hz, E1 = 41.2Hz, F1 = 43.6Hz, G1 = 49.0Hz, A1 = 55.0Hz)
        scale = [32.7, 36.7, 41.2, 43.6, 49.0, 55.0, 65.4]
        note_dur = rng.choice([0.5, 1.0, 2.0])
        signal = np.zeros_like(t)

        current_time = 0.0
        while current_time < duration:
            idx = int(current_time * sr)
            if idx < len(t):
                rem_t = t[idx:] - current_time
                seg_len = min(len(rem_t), int(note_dur * sr))
                sub_t = rem_t[:seg_len]
                freq = rng.choice(scale)

                if is_reese:
                    # Detuned multi-sawtooth with beating
                    detune = rng.uniform(0.8, 1.5)
                    saw1 = 2 * (sub_t * (freq - detune) - np.floor(0.5 + sub_t * (freq - detune)))
                    saw2 = 2 * (sub_t * (freq + detune) - np.floor(0.5 + sub_t * (freq + detune)))
                    sub = np.sin(2 * np.pi * (freq / 2.0) * sub_t)
                    bass = (saw1 * 0.35 + saw2 * 0.35 + sub * 0.5)
                    # Lowpass filtering
                    bass = np.tanh(bass * 1.5) * 0.7
                    signal[idx:idx+seg_len] += bass

                elif is_acid:
                    # Resonant filter sweep on saw/square
                    saw = 2 * (sub_t * freq - np.floor(0.5 + sub_t * freq))
                    cutoff_mod = np.exp(-sub_t / (note_dur * 0.6))
                    res_tone = np.sin(2 * np.pi * freq * (2.0 + 4.0 * cutoff_mod) * sub_t)
                    bass = (saw * 0.6 + res_tone * 0.4) * np.exp(-sub_t / note_dur)
                    signal[idx:idx+seg_len] += np.tanh(bass * 2.0) * 0.65

                else:
                    # Deep warm sub bass
                    sub = np.sin(2 * np.pi * freq * sub_t) * 0.75
                    harm = np.sin(2 * np.pi * freq * 2 * sub_t) * 0.25
                    env = np.exp(-sub_t / (note_dur * 0.9))
                    signal[idx:idx+seg_len] += (sub + harm) * env * 0.8

            current_time += note_dur

        return np.tanh(signal * 1.3)

    def _synth_cinematic_impact(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float) -> np.ndarray:
        """Massive cinematic trailer impact with sub boom, metallic hit, and huge reverb tail"""
        # Low frequency sub sweep
        f_sub = 110.0 * np.exp(-t / 0.15) + 32.0
        phase = 2 * np.pi * np.cumsum(f_sub) / sr
        sub_boom = np.sin(phase) * np.exp(-t / min(duration, 3.5))

        # Metallic smash transient
        noise = rng.normal(0, 1, len(t))
        metal_ring = (
            np.sin(2 * np.pi * 380 * t) * 0.4 +
            np.sin(2 * np.pi * 740 * t) * 0.3 +
            np.sin(2 * np.pi * 1420 * t) * 0.2
        ) * np.exp(-t / 0.3)
        hit_transient = (noise * 0.5 + metal_ring) * np.exp(-t / 0.12)

        # Distant reverb rumble
        rumble = rng.normal(0, 1, len(t)) * np.exp(-t / min(duration, 4.0)) * 0.25

        impact = sub_boom * 0.7 + hit_transient * 0.5 + rumble
        return np.tanh(impact * 1.8)

    def _synth_riser(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float) -> np.ndarray:
        """Building cinematic tension riser"""
        # Frequency rising exponentially from 60Hz to 1800Hz
        norm_t = t / duration
        freq = 60.0 * (30.0 ** norm_t)
        phase = 2 * np.pi * np.cumsum(freq) / sr

        # Saw wave riser + modulated noise
        saw = 2 * (phase / (2 * np.pi) - np.floor(0.5 + phase / (2 * np.pi)))
        noise = rng.normal(0, 1, len(t)) * (norm_t ** 1.5)

        # Increasing amplitude envelope
        env = norm_t ** 1.2
        riser = (saw * 0.6 + noise * 0.4) * env
        return np.tanh(riser * 1.4)

    def _synth_downer(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float) -> np.ndarray:
        """Falling cinematic downer / sub drop"""
        norm_t = t / duration
        freq = 450.0 * np.exp(-norm_t * 3.5) + 28.0
        phase = 2 * np.pi * np.cumsum(freq) / sr
        sub = np.sin(phase) * np.exp(-norm_t * 1.8)
        return np.tanh(sub * 1.5)

    def _synth_whoosh(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float) -> np.ndarray:
        """Dynamic transition whoosh with Doppler center peak"""
        noise = rng.normal(0, 1, len(t))
        center = duration / 2.0
        # Bell curve envelope
        env = np.exp(-((t - center) ** 2) / (0.15 * (duration ** 2)))
        # Modulation sweep
        mod = np.sin(2 * np.pi * (100 + 400 * env) * t)
        whoosh = noise * env * 0.7 + mod * env * 0.3
        return np.tanh(whoosh * 1.6)

    def _synth_horror_soundscape(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float, prompt: str) -> np.ndarray:
        """Dark atmospheric horror drone with dissonant clusters and eerie modulations"""
        # Clustered microtonal sines (dissonant tritones / minor seconds)
        base_f = rng.uniform(40, 65)
        freqs = [base_f, base_f * 1.414, base_f * 1.059, base_f * 2.0, base_f * 2.828]

        drone = np.zeros_like(t)
        for i, f in enumerate(freqs):
            # Slow LFO pitch/amplitude modulation
            lfo_rate = 0.15 + 0.1 * i
            lfo = 1.0 + 0.08 * np.sin(2 * np.pi * lfo_rate * t)
            drone += np.sin(2 * np.pi * f * lfo * t) * (1.0 / len(freqs))

        # Metallic scrape texture if requested
        if "metallic" in prompt or "scrape" in prompt:
            scrape = np.sin(2 * np.pi * 1840 * t) * np.sin(2 * np.pi * 320 * t) * rng.normal(0, 0.4, len(t))
            drone += scrape * 0.25

        # Sub rumble
        sub_rumble = np.sin(2 * np.pi * 32 * t) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.2 * t))
        total = drone * 0.6 + sub_rumble * 0.4
        return np.tanh(total * 1.5)

    def _synth_piano_progression(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float, prompt: str) -> np.ndarray:
        """Warm piano chord progression with multi-harmonic decay"""
        # Chord frequencies (e.g. Am -> F -> C -> G)
        chords = [
            [220.0, 261.63, 329.63],        # Am (A3, C4, E4)
            [174.61, 220.0, 261.63, 329.63],# Fmaj7 (F3, A3, C4, E4)
            [130.81, 164.81, 196.0, 246.94],# Cmaj7 (C3, E3, G3, B3)
            [196.0, 246.94, 293.66, 392.0]  # G (G3, B3, D4, G4)
        ]

        chord_dur = min(duration / 2.0, 3.0)
        signal = np.zeros_like(t)

        current_time = 0.0
        chord_idx = 0
        while current_time < duration:
            chord = chords[chord_idx % len(chords)]
            chord_idx += 1
            idx = int(current_time * sr)

            if idx < len(t):
                rem_t = t[idx:] - current_time
                seg_len = min(len(rem_t), int(chord_dur * sr))
                sub_t = rem_t[:seg_len]

                chord_sound = np.zeros(seg_len)
                for note_f in chord:
                    # Piano physics approximation: strike attack + multi-harmonic decay
                    h1 = np.sin(2 * np.pi * note_f * sub_t) * np.exp(-sub_t / 1.8)
                    h2 = np.sin(2 * np.pi * note_f * 2 * sub_t) * np.exp(-sub_t / 1.1) * 0.4
                    h3 = np.sin(2 * np.pi * note_f * 3 * sub_t) * np.exp(-sub_t / 0.7) * 0.18
                    h4 = np.sin(2 * np.pi * note_f * 4 * sub_t) * np.exp(-sub_t / 0.4) * 0.08
                    hammer = rng.uniform(-1, 1, seg_len) * np.exp(-sub_t / 0.008) * 0.05
                    chord_sound += (h1 + h2 + h3 + h4 + hammer)

                signal[idx:idx+seg_len] += chord_sound * (0.8 / len(chord))

            current_time += chord_dur

        return np.tanh(signal * 1.3)

    def _synth_strings_ensemble(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float, prompt: str) -> np.ndarray:
        """Lush orchestral strings with detuned unison and slow expressive swelling"""
        chords = [
            [130.81, 196.0, 261.63, 329.63], # C3, G3, C4, E4
            [110.0, 164.81, 220.0, 261.63],  # A2, E3, A3, C4
            [87.31, 130.81, 174.61, 220.0],  # F2, C3, F3, A3
            [98.0, 146.83, 196.0, 246.94]    # G2, D3, G3, B3
        ]
        chord_dur = min(duration / 2.0, 4.0)
        signal = np.zeros_like(t)

        current_time = 0.0
        chord_idx = 0
        while current_time < duration:
            chord = chords[chord_idx % len(chords)]
            chord_idx += 1
            idx = int(current_time * sr)

            if idx < len(t):
                rem_t = t[idx:] - current_time
                seg_len = min(len(rem_t), int(chord_dur * sr))
                sub_t = rem_t[:seg_len]

                # Slow swell envelope
                attack = 0.8
                decay = 0.8
                env = np.ones(seg_len)
                att_samples = int(min(attack * sr, seg_len // 2))
                if att_samples > 0:
                    env[:att_samples] = np.linspace(0, 1, att_samples)
                dec_samples = int(min(decay * sr, seg_len // 2))
                if dec_samples > 0:
                    env[-dec_samples:] = np.linspace(1, 0, dec_samples)

                chord_sound = np.zeros(seg_len)
                for note_f in chord:
                    # 3 detuned sawtooth voices per note for rich ensemble chorus
                    detunes = [-0.6, 0.0, 0.6]
                    for d in detunes:
                        freq = note_f + d
                        saw = 2 * (sub_t * freq - np.floor(0.5 + sub_t * freq))
                        # Soften saw with sin blend
                        voice = saw * 0.4 + np.sin(2 * np.pi * freq * sub_t) * 0.6
                        chord_sound += voice * (0.33 / len(chord))

                signal[idx:idx+seg_len] += chord_sound * env

            current_time += chord_dur

        return np.tanh(signal * 1.4)

    def _synth_lead_melody(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float, prompt: str) -> np.ndarray:
        """Synthwave / electronic lead melody with arpeggiator or lyrical lines"""
        # Minor pentatonic scale (A minor pentatonic: A, C, D, E, G in octaves 4 and 5)
        scale = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99]
        bpm = rng.choice([100, 120, 128, 140])
        step_len = 60.0 / bpm / 2.0  # 8th notes

        signal = np.zeros_like(t)
        current_time = 0.0
        while current_time < duration:
            idx = int(current_time * sr)
            if idx < len(t):
                rem_t = t[idx:] - current_time
                seg_len = min(len(rem_t), int(step_len * sr))
                sub_t = rem_t[:seg_len]
                freq = rng.choice(scale)

                # Pluck / Lead timbre
                lead = (
                    np.sin(2 * np.pi * freq * sub_t) * 0.6 +
                    np.sin(2 * np.pi * freq * 2.0 * sub_t) * 0.25 +
                    np.sin(2 * np.pi * freq * 3.0 * sub_t) * 0.15
                ) * np.exp(-sub_t / (step_len * 0.8))

                signal[idx:idx+seg_len] += lead * 0.7

            current_time += step_len

        return np.tanh(signal * 1.3)

    def _synth_full_music_track(self, t: np.ndarray, sr: int, rng: np.random.RandomState, duration: float, prompt: str) -> np.ndarray:
        """Complete multi-track algorithmic arrangement: Drums + Bass + Chords + Lead/Atmosphere"""
        bpm = 110
        if "lofi" in prompt or "chill" in prompt or "relax" in prompt:
            bpm = rng.choice([75, 80, 85])
        elif "synthwave" in prompt or "retrowave" in prompt:
            bpm = rng.choice([115, 120, 125])
        elif "edm" in prompt or "dance" in prompt or "house" in prompt:
            bpm = rng.choice([124, 128, 130])
        elif "fast" in prompt:
            bpm = rng.choice([135, 145, 160])
        elif "slow" in prompt or "ambient" in prompt:
            bpm = rng.choice([60, 70, 75])

        beat_dur = 60.0 / bpm
        bar_dur = beat_dur * 4.0

        # Multi-track audio layers
        drums = np.zeros_like(t)
        bass = np.zeros_like(t)
        harmony = np.zeros_like(t)
        melody = np.zeros_like(t)

        # Scale selection (A minor / C major friendly)
        scale_bass = [55.0, 43.65, 32.7, 49.0] # A1, F1, C1, G1
        chords = [
            [220.0, 261.63, 329.63, 392.0], # Am7
            [174.61, 220.0, 261.63, 329.63],# Fmaj7
            [130.81, 164.81, 196.0, 246.94],# Cmaj7
            [196.0, 246.94, 293.66, 392.0]  # G7
        ]
        lead_scale = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0]

        # 1. Generate Drums Layer
        current_beat = 0.0
        beat_idx = 0
        while current_beat < duration:
            idx = int(current_beat * sr)
            if idx < len(t):
                rem_t = t[idx:] - current_beat
                is_kick = (beat_idx % 4 == 0) or (beat_idx % 4 == 2 and bpm > 110)
                is_snare = (beat_idx % 4 == 2) or (beat_idx % 4 == 1 and bpm <= 85)

                if is_kick:
                    k_t = rem_t[:min(len(rem_t), int(0.3 * sr))]
                    f = 130 * np.exp(-k_t / 0.05) + 45
                    drums[idx:idx+len(k_t)] += np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-k_t / 0.18) * 0.7

                if is_snare:
                    s_t = rem_t[:min(len(rem_t), int(0.25 * sr))]
                    snare_noise = rng.normal(0, 1, len(s_t)) * np.exp(-s_t / 0.12)
                    snare_tone = np.sin(2 * np.pi * 190 * s_t) * np.exp(-s_t / 0.07) * 0.4
                    drums[idx:idx+len(s_t)] += (snare_noise + snare_tone) * 0.55

                # Hi-hat on 8th note subdivisions
                h_t = rem_t[:min(len(rem_t), int(0.06 * sr))]
                hat_noise = rng.uniform(-1, 1, len(h_t)) * np.exp(-h_t / 0.02) * 0.25
                drums[idx:idx+len(h_t)] += hat_noise

            current_beat += beat_dur / 2.0  # 8th note step
            beat_idx += 1

        # 2. Generate Harmony & Chords Layer
        current_bar = 0.0
        bar_idx = 0
        while current_bar < duration:
            chord = chords[bar_idx % len(chords)]
            bass_f = scale_bass[bar_idx % len(scale_bass)]
            bar_idx += 1
            idx = int(current_bar * sr)

            if idx < len(t):
                rem_t = t[idx:] - current_bar
                seg_len = min(len(rem_t), int(bar_dur * sr))
                sub_t = rem_t[:seg_len]

                # Bass note for this bar
                b_note = np.sin(2 * np.pi * bass_f * sub_t) * np.exp(-sub_t / (bar_dur * 0.9)) * 0.65
                bass[idx:idx+seg_len] += b_note

                # Pad / Key chord
                chord_sound = np.zeros(seg_len)
                for nf in chord:
                    chord_sound += np.sin(2 * np.pi * nf * sub_t) * (0.35 / len(chord))
                # Gentle envelope
                env = np.sin(np.pi * sub_t / bar_dur) ** 0.5
                harmony[idx:idx+seg_len] += chord_sound * env * 0.5

            current_bar += bar_dur

        # 3. Generate Melody / Lead Arpeggios
        current_step = 0.0
        step_dur = beat_dur / 2.0
        while current_step < duration:
            idx = int(current_step * sr)
            if idx < len(t):
                rem_t = t[idx:] - current_step
                seg_len = min(len(rem_t), int(step_dur * sr))
                sub_t = rem_t[:seg_len]
                freq = rng.choice(lead_scale)

                lead_note = (
                    np.sin(2 * np.pi * freq * sub_t) * 0.5 +
                    np.sin(2 * np.pi * freq * 2 * sub_t) * 0.2
                ) * np.exp(-sub_t / (step_dur * 0.8))
                melody[idx:idx+seg_len] += lead_note * 0.35

            current_step += step_dur

        # Mix all tracks together with balance
        mixed = drums * 0.45 + bass * 0.4 + harmony * 0.35 + melody * 0.3
        return np.tanh(mixed * 1.5)

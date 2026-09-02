# PKmusicgen - Free Online & Offline AI Music Studio

🎵 **A complete, professional-grade, 100% Free AI Music & Sample Generation Web Application and API.**

Create high-quality original music, lo-fi beats, synthwave tracks, cinematic film scores, 808 trap grooves, horror sound designs, acoustic melodies, and drum stems — **completely free, with zero subscriptions, zero paid API keys, and zero telemetry**.

```
Text Prompt / Style Tag → AI Neural & DSP Synthesis → Interactive Waveform Preview → Audio FX Studio → Export WAV
```

**⚡ Instant Free Online Generation • 🌐 Modern Dark Web Studio UI • 🔒 100% Private & Offline-Capable**

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)
![Platform: Windows | Linux | Mac | Cloud](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)
![Free Tier: Unlimited](https://img.shields.io/badge/Free%20Tier-100%25%20Free-brightgreen.svg)

---

## ✨ Features & Studio Modes

### 🎛️ 1. AI Music Studio
- **Text-to-Music Synthesis**: Natural language prompts → high-fidelity stereo WAV tracks (44.1kHz / 48kHz).
- **One-Click Style Chips**: Lo-Fi Chill, 80s Synthwave, Epic Cinematic, 808 Trap Beat, Cyberpunk EDM, Indian Folk & Tabla, Emotional Piano, Ambient Meditation, 8-Bit Chiptune.
- **🎲 Surprise Me / Random Prompt Generator**: Generates instant creative prompts with calibrated tempo, key, and instrumentation.
- **Interactive Audio Waveform Visualizer**: Real-time synchronized animated playhead, scrub timeline, and spectrum meter.
- **1-Click Musical Variations**: Transform any track instantly into *Darker, Brighter, Faster, Slower, More Percussion, More Cinematic, Heavier Bass, or More Atmospheric*.

### 🎹 2. Song & Lyrics AI Assistant
- **Automated Song Blueprints**: Generates full musical arrangement structures (Intro → Verse 1 → Pre-Chorus → Chorus → Verse 2 → Bridge → Final Chorus → Outro).
- **Chords & Scales**: Suggests musical keys (e.g. `A Minor`, `D Minor`) and chord progressions.
- **AI Lyric Generator**: Generates rhyming verses and narrative hooks matching your concept.
- **Direct 1-Click Synthesis**: Turn the generated song plan directly into audio with one click.

### 🎚️ 3. Audio FX & Post-Processing Studio
- **Algorithmic Schroeder Reverb**: Smooth stereo room acoustics and lush atmospheric tails.
- **Deep Bass Boost Filter**: Low-shelf analog-style bass enhancement (+0 to +12 dB).
- **🎧 8D Spatial Audio**: Binaural dynamic rotation for immersive 360-degree headphone listening.
- **Master Peak Normalization**: Ensures broadcast-ready 0 dBFS audio without clipping.
- **Fade In / Fade Out**: Non-destructive fade curves to prevent pops and clicks.

### 🥁 4. One-Shot Samples & Stem Generator
- **Drum Kits**: 808 Kick, Acoustic Kick, Punchy Snare, Trap Snare, Clap, Hi-Hats, Toms, Cymbals.
- **Bass & Subs**: Sub Bass, Acid 303, Reese Bass, Cinematic Braam, Synth Bass.
- **Melodic Instruments**: Grand Piano, Rhodes Keys, Orchestral Strings, Synth Plucks, Ambient Pads.
- **World & Folk Percussion**: Tabla (Dayan/Bayan), South Indian Tamate, Chende, Dollu, Mridangam, Dholak.
- **Batch Generator**: Generate 1 to 10 variations automatically in a single batch.

### 🎬 5. Film Score & BGM Studio
- **Narrative Scene Scoring**: Input your scene description (e.g. *"An astronaut discovering an ancient alien monolith at dawn"*).
- **Emotion & Intensity Controls**: Tension, Supernatural Fear, Sadness, Joy, Mystery, Epic Heroic.
- **Automatic Score Variations**: Generates multiple cues for director preview.

### 👻 6. Horror & Sound Design Studio
- **Engineered Tension**: Deep horror drones, sub-bass rumbles, metallic scrapes, suspense pulses, eerie whispers, and jumpscare trailer hits.
- **Customizable Frequency & Movement**: Slowly evolving, pulsing, rising, or falling envelopes.

### 📚 7. Studio Library & History
- **SQLite Database Storage**: Automatically catalogs all generated tracks with metadata, peak dB, RMS dB, duration, and seed.
- **Search & Filter**: Search by keyword, genre, category, model, or favorites.
- **Bulk Export & Audio Management**: Download WAV files with one click.

---

## 🤖 Models & Architecture

| Model ID | Source | License | Commercial? | VRAM | Max Duration | Best For | Status |
|---|---|---|---|---|---|---|---|
| `procedural-dsp` | Built-in Engine | MIT | **Yes - 100% Free** | 0 GB (CPU) | 240s | All genres, drums, bass, synth, film cues, loops | **Built-in & Instant** |
| `stable-audio-open-1.0` | Stability AI | Community License | **Free (<$1M rev)** | 14.5 GB | 47s | SFX, textures, cinematic impacts | Downloadable |
| `ace-step-3.5b` | StepFun / ACE | Apache 2.0 | **Yes - Fully Free** | 8-12 GB | 240s | Full musical songs and film cues | Downloadable |
| `musicgen-medium` | Meta AI | MIT code / CC-BY-NC weights | Non-commercial | 16 GB | 30s | Research & personal experimentation | Downloadable |

---

## 🚀 Quick Start (Run Locally or in Cloud)

### 1. Run via Shell Script (Linux / macOS / Cloud)
```bash
./run.sh
```

### 2. Run on Windows
```bat
run.bat
```

### 3. Manual Startup
```bash
# Install dependencies
pip install -r requirements.txt

# Start the web server & API
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 7860
```
Open your browser at **http://localhost:7860** (or your online preview URL).

---

## 🧪 Automated Testing

PKmusicgen comes with a comprehensive test suite (46+ automated unit and integration tests):

```bash
pytest tests/ -v
```

Tests verify:
- Fast DSP and Algorithmic Music Synthesis
- Model Registry and Licensing Validators
- Audio Analysis (Peak dB, RMS, Waveform Generation)
- Audio FX Processing (Reverb, Bass Boost, 8D Spatializer, Normalization, Trim, Fade)
- AI Song & Lyric Architecture Plan Generator
- SQLite Database Sample Storage and Search
- Hardware Detection & Zero-Config CPU Fallback
- FastAPI REST API Endpoints & Static File Delivery

---

## 🔒 Privacy & Free Promise

- **100% Free**: No subscription tiers, no credit limits, no paywalls.
- **No Cloud API Keys Needed**: Generates audio locally on your machine or private server.
- **No Telemetry**: Your prompts and audio remain private.
- **Offline Capable**: Works completely disconnected from the internet once launched.

---

## 📄 License

- **Application Code**: MIT License (see `LICENSE`)
- **Generated Audio**: Free for you to use in your music, games, films, and creative projects.

---

*Crafted for music producers, game developers, filmmakers, sound designers, and audio creators.*

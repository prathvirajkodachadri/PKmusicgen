# PKmusicgen - Professional Offline AI Music & Sample Generator

🎵 **A complete, professional-grade offline AI music and audio sample generation application that runs locally on Windows (and Linux).**

Designed for musicians, composers, film-score creators, sound designers, and music producers who want to generate original musical ideas, loops, one-shots, textures, percussion, cinematic sounds, and short BGM samples **without relying on cloud APIs**.

```
Text Prompt → AI Audio Generation → Preview → Edit/Regenerate → Export WAV
```

**Offline after models downloaded. No telemetry. No cloud. Your audio, your machine.**

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)
![Platform: Windows 10/11](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey.svg)
![GPU: NVIDIA CUDA + CPU fallback](https://img.shields.io/badge/GPU-CUDA%20%2B%20CPU-orange.svg)

---

## ✨ Features

### Core
- **Text-to-Audio Generation** - Natural language prompts → high-quality WAV
- **Professional Prompt Builder** - Genre, mood, texture, instrumentation → optimized prompt
- **Seed System** - Reproducible generation, random/fixed seeds displayed
- **Variation System** - Darker, Brighter, Heavier, Slower, Faster, More Percussion, More Cinematic etc (prompt transformations)
- **Audio Preview** - Play, waveform, peak/RMS, duration, loop
- **WAV Export** - 44.1/48 kHz, 16/24-bit, normalize, fade in/out, trim silence (non-destructive copies)
- **Sample Library** - SQLite, search, filter, favorite, tags, metadata, BPM, key, category
- **Batch Generation** - Generate 1-10 variations automatically

### Specialized Modes
- **Sample Generator** - Drums (kick, snare, clap, hi-hat, tom, percussion, drum loop, cinematic, tribal, folk), Bass (sub, cinematic, hit, drone, synth), Instruments (piano, strings, guitar, flute, synth, pads, plucks), Cinematic (impact, whoosh, riser, downer, drone, tension, trailer hit, horror texture, reverse, metallic)
- **Film BGM Mode** - Scene description + emotion + genre + BPM + key + intensity + instrumentation → BGM prompt + variations
- **Horror Sound Design** - Presets: horror drone, dark ambience, sub-bass rumble, metallic scrape, reverse impact, whisper texture, sudden impact, suspense pulse, low-frequency tension, distorted cinematic. Mood + texture + movement + frequency builder.
- **Indian / South Indian / Folk Presets** - Tamate, Chende, Dollu, Thavil, Mridangam, Tabla, folk percussion, Yakshagana-inspired, Coastal Karnataka atmosphere (treated as prompt presets, not claiming authentic reproduction)

### Technical
- **Model Abstraction** - `AudioGenerationModel` interface: load, unload, generate, variation, supports_text, etc. Easy to add new models
- **Model Registry** - JSON-driven, license, commercial status, VRAM, duration, size, installed detection
- **Hardware Detection** - GPU name, VRAM, CUDA, CPU, RAM, FFmpeg, torch version
- **VRAM Optimization** - Load only when required, unload, clear CUDA cache, low-VRAM mode, fp16, prevent simultaneous large models
- **Offline Mode** - Blocks downloads, no external requests after models installed
- **Security** - Binds only to 127.0.0.1, no telemetry, sanitize filenames, validate prompts, no arbitrary command execution
- **Logging** - `logs/app.log` rotating, startup, hardware, model load, generation time, errors
- **Config-driven** - `config.yaml` for paths, audio defaults, generation defaults, GPU settings, UI settings

---

## 🏗️ Architecture

```
Frontend (SPA dark UI) → FastAPI Backend → Model Abstraction → Audio Export → SQLite Library
         ↓                        ↓
   Prompt Builder, Film BGM, Horror Designer, Variation System
```

See `docs/architecture.md` for detailed architecture.

---

## 🤖 Models & Licensing (Critical!)

We **do not** blindly use popular models. We checked licenses for commercial use.

| Model ID | HF Repo | License | Commercial? | VRAM | Max Duration | Best For | Default? |
|---|---|---|---|---|---|---|---|
| `procedural-dsp` | Built-in | MIT | **Yes** | 0 GB | 60s | Fallback, always works, tests, drums, drones | **Yes - built-in fallback** |
| `stable-audio-open-1.0` | `stabilityai/stable-audio-open-1.0` | Stability AI Community License | **Yes if revenue < $1M**, else Enterprise | 14.5GB peak (chunked ~6GB) | 47s | SFX, samples, textures, cinematic hits, horror | **Recommended AI default for samples** |
| `ace-step-3.5b` | `ACE-Step/ACE-Step-v1-3.5B` | Apache 2.0 | **Yes fully** | 8-12GB | 240s | Music, BGM, film cues, full songs | **Recommended AI default for music** |
| `yue-7b` | `m-a-p/YuE-s1-7B-anneal-en-cot` | Apache 2.0 | **Yes, attribution requested** | 16GB+ | 240s | Full songs with vocals | Optional heavy |
| `musicgen-medium` | `facebook/musicgen-medium` | CC-BY-NC 4.0 (weights) + MIT (code) | **No - Non-commercial only** | 16GB | 30s | Research, non-commercial | Optional, marked NC |

**Why this selection?**
- MusicGen is popular but CC-BY-NC 4.0 = **non-commercial**, so NOT default
- Stable Audio Open: clean training data (Freesound CC0/CC BY/CC Sampling+ + FMA), commercial <$1M free, perfect for samples/SFX
- ACE-Step: Apache 2.0 fully commercial, fast, high quality, up to 4 min, best for music/BGM
- Procedural DSP: guarantees MVP works, zero VRAM, passes tests offline, no download needed

**Full licensing details in `MODEL_LICENSES.md` - READ BEFORE COMMERCIAL USE.**

> **We do NOT claim generated audio is automatically copyright-free.** AI copyright varies by jurisdiction. You are responsible for checking output for similarity and understanding local laws.

---

## 💻 Requirements

- **OS:** Windows 10/11 (primary), Linux supported (run.sh)
- **Python:** 3.11+
- **RAM:** 16GB recommended, 8GB minimum
- **GPU:** NVIDIA with CUDA 12.1+ recommended (RTX 3060 12GB+ for AI models), CPU fallback works
- **Disk:** 10GB for app + 2.5GB per Stable Audio Open, 7.5GB per ACE-Step, 14GB per YuE
- **FFmpeg:** Recommended for some processing (optional for basic WAV)
- **Internet:** Only for initial model download, then fully offline

---

## 🚀 Installation (Windows)

### Quick Start

1. **Double-click `install_windows.bat`**
   - Checks Python
   - Creates venv
   - Detects CUDA, installs PyTorch CUDA or CPU
   - Installs dependencies
   - Creates dirs
   - Checks FFmpeg
   - Runs system test

2. **Double-click `run.bat`**
   - Starts FastAPI at http://127.0.0.1:7860
   - Opens browser automatically
   - API docs at http://127.0.0.1:7860/docs

3. **First-Run Setup in UI:**
   - Go to Settings → check hardware detection
   - Go to Models → see available models, license, VRAM, size
   - Download a model (requires internet):
     - For testing: `procedural-dsp` already built-in, no download
     - For SFX/samples: `stable-audio-open-1.0` (2.5GB, commercial <$1M)
     - For music/BGM: `ace-step-3.5b` (7.5GB, Apache 2.0 fully commercial)
   - After download, you can enable Offline Mode in Settings

**Goal: Double-click run.bat → open local app → generate audio.**

### Manual Installation

```bash
python -m venv venv
venv\Scripts\activate.bat  # Windows
# or source venv/bin/activate # Linux

# CUDA version (if NVIDIA GPU)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
# CPU version (if no GPU)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

pip install -r requirements.txt

# Create dirs
mkdir models outputs samples presets logs data

# Run
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 7860
```

---

## 🎮 Usage

### Generate Page
- **Prompt Builder:** Select genre, mood, texture, instrumentation → Build → editable final prompt
- **Prompt Presets:** Tabs for cinematic, horror, drums, Indian folk, film BGM → click to load
- **Settings:** Model, duration, seed, variations, guidance, sample rate, bit depth, normalize, fade
- **Generate:** Click → status → results with waveform, audio player, peak/RMS, download, favorite, variation

### Sample Generator Mode
- Click drum/bass/instrument/cinematic/Indian categories → loads prompt → Generate
- Batch: enter prompt + count (5) → Generate Batch

### Film BGM Mode
- Scene description + emotion + genre + duration + BPM + key + intensity + instrumentation + reference mood
- Build Prompt → preview → Generate BGM Variations (3 variations)

### Horror Mode
- Mood + texture + movement + frequency + preset + duration
- Build → preview → Generate
- Preset grid: click horror drone, dark ambience, sub-bass rumble etc.

### Library
- Search prompt/filename/tags, filter category/model/favorites
- Audio preview, download, favorite toggle, variation, delete
- Stats: total samples, size, avg duration, favorites

### Models
- List installed/available, license, commercial status, VRAM, size, HF repo
- Download (requires internet), uninstall, load/unload, VRAM status
- First-run instructions

### Settings
- Hardware: GPU, VRAM, CUDA, CPU, RAM, FFmpeg, Python
- Paths, default model, offline mode toggle, audio defaults
- About

---

## 📝 Prompt Examples

### Cinematic
"Modern cinematic orchestral tension, deep low strings, subtle percussion, dark atmosphere, gradual build, no vocals."

### Horror
"Extremely dark horror ambience, deep sub bass drone, metallic resonance, distant unsettling texture, slow evolution, no melody."

### Impact
"Massive cinematic impact, deep bass hit, metallic layer, short decay, dramatic trailer sound."

### Folk Percussion
"Raw energetic South Indian folk percussion ensemble, dry acoustic recording, organic performance, strong rhythmic accents."

### Tamate
"Traditional-style South Indian folk frame drum percussion, dry close recording, energetic rhythmic phrase, natural acoustic dynamics."

> **Note:** AI approximations, not claiming authentic traditional instrument reproduction.

### Film BGM
Scene: "An old abandoned house at midnight. A man slowly walks through the corridor and hears a child laughing."
Emotion: "Tension and supernatural fear"
Style: "Modern cinematic horror"
Duration: "20 seconds"
→ Converts to optimized prompt with variations.

---

## 📁 Project Structure

```
PKmusicgen/
├── backend/
│   ├── api/
│   │   ├── main.py
│   │   └── routes/
│   │       ├── generate.py
│   │       ├── library.py
│   │       ├── models_api.py
│   │       ├── hardware_api.py
│   │       └── presets_api.py
│   ├── core/
│   │   ├── config.py
│   │   ├── hardware.py
│   │   ├── logging_config.py
│   │   └── errors.py
│   ├── models/
│   │   ├── base_model.py
│   │   ├── model_registry.py
│   │   ├── procedural_model.py
│   │   ├── stable_audio_model.py
│   │   ├── ace_step_model.py
│   │   └── musicgen_model.py
│   ├── audio/
│   │   ├── export.py
│   │   ├── analysis.py
│   │   └── processing.py
│   ├── generation/
│   │   ├── prompt_builder.py
│   │   ├── variation.py
│   │   ├── film_bgm.py
│   │   └── horror_mode.py
│   └── database/
│       └── db.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── presets/
│   ├── cinematic.json
│   ├── horror.json
│   ├── drums.json
│   ├── bass.json
│   ├── instruments.json
│   ├── indian_folk.json
│   ├── film_bgm.json
│   ├── sample_generator.json
│   └── model_registry.json
├── tests/
│   ├── test_prompt_builder.py
│   ├── test_config.py
│   ├── test_model_registry.py
│   ├── test_audio_export.py
│   ├── test_hardware.py
│   ├── test_database.py
│   ├── test_procedural_model.py
│   └── test_variation.py
├── docs/
│   ├── architecture.md
│   └── troubleshooting.md
├── models/ (gitignored, local weights)
├── outputs/ (gitignored, generated WAV)
├── samples/ (gitignored)
├── logs/ (gitignored)
├── data/ (gitignored, library.db)
├── config.yaml
├── requirements.txt
├── install_windows.bat
├── run.bat
├── run.sh
├── MODEL_LICENSES.md
├── LICENSE (MIT for app)
├── README.md
└── .gitignore
```

---

## ⚙️ Configuration

`config.yaml`:

```yaml
app:
  host: "127.0.0.1"  # localhost only for security
  port: 7860
  offline_mode: false
  log_level: "INFO"

paths:
  model_dir: "./models"
  output_dir: "./outputs"
  # ...

audio:
  default_sample_rate: 44100
  default_bit_depth: 16
  default_duration: 10

generation:
  default_model: "procedural-dsp"
  default_seed: -1

models:
  auto_load: false
  unload_after_generation: false
  low_vram_mode: false
  use_fp16: true
```

---

## 🧪 Testing

CPU-safe tests, no GPU needed, uses procedural-dsp fallback:

```bash
# Activate venv
venv\Scripts\activate.bat

# Run all tests
pytest tests/ -v

# Or individual
python tests/test_prompt_builder.py
python tests/test_audio_export.py
python tests/test_procedural_model.py
python tests/test_database.py
```

Tests cover:
- Prompt construction
- Configuration loading
- Model registry
- File naming
- Metadata storage
- Audio export
- WAV validation
- Hardware detection
- Offline mode
- Error handling
- Procedural model generation
- Variation system

---

## 🔒 Security

- Binds only to 127.0.0.1 by default (not public)
- No telemetry
- No cloud API after models downloaded
- Sanitize filenames from prompts
- Validate prompt length (max 1000)
- Validate file paths
- Prevent arbitrary command execution
- Validate audio extensions

---

## 🛠️ Roadmap

### Phase 1 - MVP (Done)
- [x] Hardware detection
- [x] Model manager
- [x] One commercially usable local model (procedural-dsp built-in, stable-audio-open-1.0 + ace-step-3.5b optional)
- [x] Text-to-audio generation
- [x] WAV export
- [x] Prompt presets
- [x] Audio preview
- [x] Seed system
- [x] Generation history (SQLite library)
- [x] Windows installation (install_windows.bat, run.bat)
- [x] Offline operation
- [x] README and licensing docs

### Phase 2
- [x] Batch generation (implemented)
- [x] Sample library (implemented)
- [x] Tags, favorites (implemented)
- [x] Variation system (implemented)
- [x] Audio trimming, normalization, fade (implemented)
- [x] Waveform (implemented)
- [x] More prompt presets (implemented)
- [ ] Seamless loop detection
- [ ] BPM detection

### Phase 3
- [x] Multiple models (procedural, stable-audio, ace-step, musicgen)
- [ ] Audio conditioning (audio-to-audio)
- [ ] Better cinematic generation (improve procedural + integrate ACE-Step fully)
- [ ] MIDI tools
- [ ] Advanced sound design
- [ ] Stem generation
- [ ] Automatic loop detection
- [ ] VST/AU plugin
- [ ] DAW integration (FL Studio, Ableton, Reaper)
- [ ] Scene/timecode-based BGM generation

### Future
- Vocal generation (where legally supported)
- Stem separation
- AI mastering
- Automatic cinematic cue generation

---

## 🤝 Contributing

1. Fork
2. Create feature branch
3. Add tests for new features
4. Ensure procedural-dsp fallback still works (so CI passes without heavy models)
5. Update MODEL_LICENSES.md if adding new model
6. PR

Please read MODEL_LICENSES.md before adding new models - prefer Apache 2.0 / MIT.

---

## 📄 Licenses

- **App itself:** MIT (see LICENSE)
- **Models:** Separate licenses (see MODEL_LICENSES.md)
  - Procedural DSP: MIT (fully commercial)
  - Stable Audio Open 1.0: Stability AI Community License (commercial <$1M free)
  - ACE-Step 3.5B: Apache 2.0 (fully commercial)
  - YuE: Apache 2.0 (commercial encouraged with attribution)
  - MusicGen: CC-BY-NC 4.0 (non-commercial only) - not default

**We do NOT claim generated audio is automatically copyright-free.** Check local laws.

---

## 🙏 Acknowledgements

- Stability AI for Stable Audio Open (clean training data, community license)
- ACE Studio & StepFun for ACE-Step (Apache 2.0, fast, high quality)
- HKUST & M-A-P for YuE (Apache 2.0, full songs)
- Meta for MusicGen/AudioCraft (research, MIT code, though weights NC)
- Hugging Face for transformers/diffusers
- All Freesound & FMA contributors for CC0/CC BY data

---

## 📞 Troubleshooting

See `docs/troubleshooting.md` for common issues:

- Model not installed
- Insufficient VRAM
- FFmpeg not found
- CUDA unavailable
- Port in use
- etc.

Logs at `logs/app.log`

---

## 📸 Screenshots (Placeholder)

- Generate page with prompt builder, waveform, audio player
- Sample generator categories
- Film BGM mode
- Horror mode
- Library with search/favorites
- Models manager with license info
- Settings with hardware detection

---

**Made for musicians, by musicians. Offline, private, professional.**

*Last updated: 2026-09-02*

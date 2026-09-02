# PKmusicgen Architecture

## Overview
Professional offline AI music & sample generator with modular, extensible architecture.

```
Text Prompt → AI Audio Generation → Preview → Edit/Regenerate → Export WAV
```

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (SPA)                       │
│  Dark music-production UI, vanilla JS, no build step    │
│  Pages: Generate | Samples | Film BGM | Horror | Library | Models | Settings │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────────┐
│                FastAPI Backend (Python)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  api/    │ │  core/   │ │ models/  │ │  audio/  │   │
│  │ routes   │ │ config   │ │ registry │ │ export   │   │
│  │ generate │ │ hardware │ │ base     │ │ analysis │   │
│  │ library  │ │ logging  │ │ procedur │ │ process  │   │
│  │ models   │ │ errors   │ │ stable   │ └──────────┘   │
│  │ hardware │ └──────────┘ │ ace-step │ ┌──────────┐   │
│  │ presets  │              │ musicgen │ │generation│   │
│  └──────────┘              └──────────┘ │ prompt   │   │
│                                         │ variation│   │
│  ┌──────────┐                           │ film_bgm │   │
│  │ database │                           │ horror   │   │
│  │ SQLite   │                           └──────────┘   │
│  └──────────┘                                           │
└──────────────────────┬──────────────────────────────────┘
                       │ File I/O
┌──────────────────────▼──────────────────────────────────┐
│  Local Storage: models/ outputs/ presets/ data/ logs/    │
└─────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Model Abstraction (`backend/models/base_model.py`)
Abstract class `AudioGenerationModel`:
- `load()` / `unload()` - VRAM management
- `generate(request)` - main generation
- `generate_variation()` - variation system
- `supports_text()`, `supports_audio_conditioning()`
- `supported_durations()`, `get_model_info()`

Implementations:
- `ProceduralDSPModel` - Built-in DSP fallback, 0 VRAM, always works
- `StableAudioOpenModel` - Stability AI, SFX/samples, 14.5GB peak
- `ACEStepModel` - ACE-Step 3.5B, Apache 2.0, music, 8-12GB
- `MusicGenModel` - Meta, CC-BY-NC 4.0 non-commercial, optional

### 2. Model Registry (`model_registry.py`)
JSON-driven registry (`presets/model_registry.json`):
- Model name, HF repo, license, commercial status, VRAM, duration, size
- Installed detection via filesystem
- Commercial filter

### 3. Prompt System
- `PromptBuilder` - structured fields (genre, mood, texture, instrumentation) → optimized prompt
- `FilmBGMGenerator` - scene + emotion + genre → BGM prompt + variations
- `HorrorSoundDesigner` - mood + texture + movement + frequency + preset → horror prompt
- Presets stored in `presets/*.json` - editable JSON

### 4. Variation System (`variation.py`)
Prompt transformations for "darker", "brighter", etc:
- Where model doesn't support audio conditioning, transform prompt
- Presets: darker, brighter, heavier, slower, faster, more percussion, etc.

### 5. Audio Module
- `export.py` - WAV export 44.1/48kHz, 16/24-bit, sanitize filename, non-destructive processing copies
- `analysis.py` - peak, RMS, crest, waveform downsampled for UI
- `processing.py` - normalize, fade in/out, trim silence

### 6. Database (`database/db.py`)
SQLite lightweight:
- `samples` table: filename, filepath, prompt, model, seed, duration, SR, bit depth, BPM, key, category, tags, favorite, peak/RMS, creation date, generation time, metadata
- Search, filter, favorite, delete, rename, tags

### 7. Hardware Detection (`core/hardware.py`)
- OS, CPU, RAM, GPU name, VRAM, CUDA availability, torch version, FFmpeg
- VRAM info, low-VRAM detection
- Settings page display

### 8. API Routes
- `POST /api/generate/sync` - synchronous generation (blocking)
- `POST /api/generate/` - async with background task + status polling
- `GET /api/generate/status/{task_id}`
- `POST /api/generate/variation/{sample_id}/{type}`
- `GET /api/library/` - list with search/filter
- `GET /api/library/file/{id}` - download WAV
- `GET /api/models/` - list models with installed status
- `POST /api/models/download` - HF download
- `DELETE /api/models/{id}` - uninstall
- `GET /api/hardware/` - hardware info
- `GET /api/presets/` - all presets
- `POST /api/presets/horror/build`, `/film_bgm/build`, `/builder/build`

### 9. Frontend (SPA)
- Single `index.html` + `style.css` + `app.js`
- No build step, vanilla JS, dark theme
- Pages via CSS display toggle
- Audio preview with `<audio>` tag, waveform visualization
- Fetch API for backend

### 10. Configuration (`config.yaml`)
- App host/port, offline mode, log level
- Paths (model_dir, output_dir, etc) - relative resolved to absolute
- Audio defaults (SR, bit depth, duration)
- Generation defaults (model, seed, guidance)
- Model settings (auto_load, unload_after, low_vram, fp16)

## Offline Mode
- Config flag `app.offline_mode`
- When ON: blocks `/api/models/download`, checks installed before generation
- No telemetry, no external requests after models installed
- Toggle via Settings or API

## Security
- Bind only to `127.0.0.1` (localhost) by default
- No public exposure
- Sanitize filenames from prompts (regex remove invalid chars)
- Validate prompt length (max 1000)
- Validate file paths, prevent arbitrary command execution
- Validate audio extensions

## VRAM Optimization
- Load model only when required
- Unload unused models via API
- Clear CUDA cache on unload
- Low-VRAM mode flag (future: chunked decoding for Stable Audio)
- Half precision (fp16) where safe
- Prevent simultaneous large-model loading (model cache singleton, one at a time)

## Data Flow: Generation

1. User enters prompt + settings in UI
2. UI POST to `/api/generate/sync` with `GenerateRequestModel`
3. Backend:
   - Validate prompt, check offline mode
   - Get model instance from cache or create
   - `model.load()` (if not loaded)
   - Build final prompt via `PromptBuilder` if builder fields present
   - Create `GenerationRequest` dataclass
   - `model.generate(req)` → list of `GenerationResult` (audio_data as numpy)
   - For each result:
     - Generate safe filename
     - Export WAV via `export_wav()` with `ExportConfig`
     - Analyze via `analyze_audio()`
     - Save metadata to SQLite
   - Return task with results (file_url etc)
4. UI renders results with audio player, waveform, actions

## Data Flow: Library

1. UI GET `/api/library/?search=&category=&model_id=&favorite_only=`
2. Backend queries SQLite with filters, returns JSON
3. UI renders list with `<audio>` preview
4. Actions: favorite toggle, delete, download, variation

## Future Extensibility

- Add new model: implement `AudioGenerationModel` subclass, add entry to `model_registry.json`, add loader in `generate.py _get_model_instance()`
- Add new preset category: create `presets/<category>.json`, it auto appears in API
- Add new prompt builder field: extend `PromptBuilder.build()` and frontend builder UI
- Add audio-to-audio: extend base model with `supports_audio_conditioning=True` and implement
- Stem generation, MIDI, DAW integration: new modules under `backend/generation/` or `backend/audio/`

## Dependencies

Core: fastapi, uvicorn, pyyaml, numpy, scipy, soundfile, librosa, sqlalchemy, psutil

Optional heavy:
- torch, torchaudio (installed via install script with CUDA detection)
- transformers, diffusers, accelerate, huggingface-hub (for real models)
- audiocraft (for MusicGen)
- stable-audio-tools (for Stable Audio Open)

## Testing Strategy

- Unit tests for prompt builder, config, model registry, audio export, hardware, database, procedural model, variation - all CPU-safe, no GPU needed
- `procedural-dsp` ensures tests pass without downloading heavy models
- `pytest` with `httpx` for API tests (future)

## Performance

- Generation runs in background thread (FastAPI BackgroundTasks) to not freeze UI
- Progress status via polling `/api/generate/status/{task_id}`
- Waveform downsampled to 1000 points for UI
- Model cache avoids reload
- SQLite indexed for fast search

## Logging

- `logs/app.log` rotating 5MB, 3 backups
- Startup, hardware detection, model load/unload, generation time, errors, export ops
- No private user data logged unnecessarily
- Console + file handlers

## Installation Flow

`install_windows.bat`:
1. Check Python 3.11+
2. Create venv
3. Upgrade pip
4. Check nvidia-smi → install torch CUDA or CPU
5. Install requirements.txt
6. Create dirs
7. Check FFmpeg
8. Run basic system test

`run.bat`:
- Activate venv
- Open browser to http://127.0.0.1:7860
- Start uvicorn

## First-Run Setup (UI)

1. Detect hardware (Settings page)
2. Show GPU/CPU info
3. Ask user which model to download (Models page)
4. Show model size, VRAM, license
5. Download via HF (requires internet)
6. Verify download
7. Store locally in `models/<model_id>/`
8. After that, offline mode possible

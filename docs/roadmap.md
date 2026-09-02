# Roadmap

## Phase 1 - MVP (Completed)
- [x] Hardware detection
- [x] Model manager with license info
- [x] Procedural DSP fallback (0 VRAM, always works)
- [x] Stable Audio Open 1.0 integration (SFX/samples, commercial <$1M)
- [x] ACE-Step 3.5B placeholder (Apache 2.0, music/BGM)
- [x] Text-to-audio generation
- [x] WAV export 44.1/48kHz 16/24-bit
- [x] Prompt presets (cinematic, horror, drums, bass, instruments, Indian folk, film BGM)
- [x] Prompt builder (genre, mood, texture, instrumentation)
- [x] Film BGM mode (scene + emotion → prompt)
- [x] Horror sound design mode (mood + texture + movement + frequency)
- [x] Audio preview (play, waveform, peak/RMS)
- [x] Seed system (random/fixed)
- [x] Generation history (SQLite library)
- [x] Variation system (darker, brighter, heavier etc)
- [x] Windows installation (install_windows.bat, run.bat)
- [x] Offline operation (offline mode toggle)
- [x] README, MODEL_LICENSES.md, architecture docs
- [x] Tests (CPU-safe)
- [x] Logging, error handling, security (localhost only)

## Phase 2 - Enhanced Sampling (Partially Done, Continue)
- [x] Batch generation
- [x] Sample library with search/filter/favorite/tags
- [x] Variation system
- [x] Audio trimming, normalization, fade
- [x] Waveform visualization
- [x] More prompt presets
- [ ] Seamless loop detection
- [ ] Automatic BPM detection
- [ ] Key detection
- [ ] Better sample categorization UI
- [ ] Export to specific DAW formats (Ableton, FL Studio)

## Phase 3 - Advanced Models & Sound Design
- [x] Multiple models abstraction
- [ ] Full ACE-Step loader (currently placeholder, needs official repo integration)
- [ ] YuE full loader (full songs with vocals)
- [ ] Audio-to-audio generation
- [ ] Melody conditioning
- [ ] Better cinematic generation
- [ ] Stem generation
- [ ] MIDI generation
- [ ] Advanced sound design tools
- [ ] Real-time preview

## Phase 4 - Pro Features
- [ ] Stem separation
- [ ] AI mastering
- [ ] Automatic cinematic cue generation
- [ ] Scene/timecode-based BGM generation
- [ ] DAW integration (VST/AU plugin)
- [ ] FL Studio integration
- [ ] Ableton integration
- [ ] Reaper integration
- [ ] Cloud sync optional (still offline-first)

## Long Term
- [ ] Collaborative library
- [ ] Fine-tuning UI (LoRA)
- [ ] Voice generation (where legally supported)
- [ ] Video-to-music
- [ ] Mobile app

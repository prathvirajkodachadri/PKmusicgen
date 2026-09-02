# PKmusicgen Portable

A clean Windows-portable Python launcher for local AI music generation.

## Design goals

- Real ACE-Step 1.5 inference; no procedural/DSP fallback.
- Self-contained Python virtual environment under `runtime/` for development packaging.
- Model weights remain outside Git and are stored under `models/ace-step-1.5/`.
- Generated audio is written to `outputs/`.
- Clear errors when the AI model or runtime is unavailable.

## Build direction

The portable release will bundle a Python runtime, dependencies, launcher, and application code. GPU-specific PyTorch wheels are installed during the build/package step rather than committed to Git.

Do not commit model weights or Python environments to this repository.

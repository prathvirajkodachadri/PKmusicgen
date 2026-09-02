# Troubleshooting Guide

## Common Issues

### Model not installed
**Error:** "Model not installed. Open Model Manager to download it."
**Fix:**
- Go to Models page
- Check if model shows ✅ installed
- If not, click Download (requires internet)
- For built-in fallback, select `procedural-dsp` - always works, no download

### Not enough GPU memory
**Error:** "Not enough GPU memory for this model. Try Low VRAM mode or a smaller model."
**Fix:**
- Use `procedural-dsp` (0 VRAM)
- Use `stable-audio-open-1.0` with chunked decoding (reduces from 14.5GB to ~6GB)
- Close other GPU apps
- Try CPU mode: set device to CPU in config or use procedural
- Upgrade GPU or use smaller model

### FFmpeg not found
**Error:** "FFmpeg is required for this operation."
**Fix:**
- Windows: Download from https://ffmpeg.org/download.html
- Extract and add `bin` folder to PATH
- Or place `ffmpeg.exe` in project root
- Restart app

### CUDA unavailable
**Message:** "GPU acceleration unavailable. CPU mode enabled."
**Fix:**
- This is OK, app will work in CPU mode but slower
- To enable GPU:
  - Install NVIDIA driver
  - Install CUDA 12.1+
  - Reinstall PyTorch with CUDA: `pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121`
  - Check `nvidia-smi` works

### Generation failed
**Error:** "Audio generation failed"
**Check:**
- `logs/app.log` for detailed traceback
- Prompt not empty and <1000 chars
- Model loaded correctly
- Enough disk space in `outputs/`
- Try procedural-dsp first to isolate model issue

### Port already in use
**Error:** "Address already in use 7860"
**Fix:**
- Change port in `config.yaml` app.port
- Or kill process using port: `netstat -ano | findstr 7860` then `taskkill /PID <pid> /F`

### Frontend not loading
**Fix:**
- Check backend is running: http://127.0.0.1:7860/docs should show API docs
- Check `frontend/index.html` exists
- Try hard refresh Ctrl+F5
- Check browser console for errors

### Database locked
**Error:** "database is locked"
**Fix:**
- Close other instances of app
- Delete `data/library.db-journal` if exists
- Restart app

### Hugging Face download fails
**Error:** Download fails or timeout
**Fix:**
- Check internet
- Check offline mode is OFF
- Try manual download: `huggingface-cli download stabilityai/stable-audio-open-1.0 --local-dir models/stable-audio-open-1.0`
- Check HF token if model is gated (Stable Audio Open requires accepting license on HF website)

### Audio file not found
**Error:** "File not found on disk"
**Fix:**
- File may have been manually deleted from `outputs/`
- Delete entry from library (it will remove DB record)
- Regenerate

### Slow generation
**Expected:**
- Procedural: <1 sec
- Stable Audio Open on GPU: 10-30 sec for 10 sec audio
- Stable Audio Open on CPU: 2-5 minutes
- ACE-Step on GPU: 20 sec for 1 min music
- MusicGen medium on GPU: 15 sec for 10 sec

**If slower:**
- Check CPU vs GPU mode in Settings
- Close other apps
- Use shorter duration for testing
- Use procedural for fast iteration

### Python version issues
**Requires:** Python 3.11+
**Fix:**
- Install Python 3.11 from python.org
- Check "Add to PATH"
- Recreate venv: delete `venv` folder, run `install_windows.bat` again

### Import errors
**Error:** "No module named 'torch'" or similar
**Fix:**
- Activate venv: `venv\Scripts\activate.bat`
- Install: `pip install -r requirements.txt`
- For torch: use install script which auto-detects CUDA

### Offline mode blocks download
**Error:** "Offline Mode is ON. Cannot download models"
**Fix:**
- Go to Settings, disable Offline Mode
- Or edit `config.yaml` app.offline_mode: false
- Restart app

## Logs

Check `logs/app.log` for detailed errors:
- Startup issues
- Model loading
- Generation time
- Export operations

Log location: `./logs/app.log` (rotating 5MB, 3 backups)

## Still stuck?

1. Check README.md for requirements
2. Check MODEL_LICENSES.md for license
3. Open issue on GitHub with:
   - OS version
   - Python version
   - GPU info (from Settings page)
   - Log file `logs/app.log`
   - Steps to reproduce
   - Screenshot if UI issue

## Performance Tips

- Use procedural-dsp for rapid prototyping, then switch to AI models for final
- Generate at 10 sec first, then longer if good
- Use variations to explore quickly
- Batch generation: 3-5 variations at once
- Keep output dir clean - old files still indexed in DB but take disk space
- Enable Low VRAM mode in config if <12GB VRAM
- Unload models after generation if RAM/VRAM limited (set `models.unload_after_generation: true` in config.yaml)

@echo off
setlocal enabledelayedexpansion

echo ============================================
echo PKmusicgen - Professional Offline AI Music Generator
echo Windows Installation Script
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.11+ from https://www.python.org/downloads/
    echo Make sure to check "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)

echo [1/7] Python found:
python --version

REM Check Python version >= 3.11
for /f "tokens=2 delims= " %%v in ('python --version') do set PYVER=%%v
echo Python version: %PYVER%

REM Create venv
echo.
echo [2/7] Creating virtual environment...
if not exist venv (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create venv
        pause
        exit /b 1
    )
) else (
    echo venv already exists, skipping
)

REM Activate and upgrade pip
echo.
echo [3/7] Activating venv and upgrading pip...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip

REM Check CUDA
echo.
echo [4/7] Checking CUDA and installing PyTorch...
nvidia-smi >nul 2>&1
if %errorlevel% equ 0 (
    echo NVIDIA GPU detected, installing PyTorch with CUDA 12.1...
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
) else (
    echo No NVIDIA GPU detected or nvidia-smi not found, installing CPU version of PyTorch...
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
)

REM Install dependencies
echo.
echo [5/7] Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies failed, trying without optional...
    pip install fastapi uvicorn pyyaml numpy scipy soundfile librosa sqlalchemy tqdm psutil
)

REM Create directories
echo.
echo [6/7] Creating required directories...
if not exist models mkdir models
if not exist outputs mkdir outputs
if not exist samples mkdir samples
if not exist presets mkdir presets
if not exist logs mkdir logs
if not exist data mkdir data

REM Check FFmpeg
echo.
echo [7/7] Checking FFmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] FFmpeg not found in PATH.
    echo Please install FFmpeg from https://ffmpeg.org/download.html
    echo And add it to PATH, or place ffmpeg.exe in this folder.
    echo The app will still work for basic WAV export, but some features need FFmpeg.
) else (
    echo FFmpeg found:
    ffmpeg -version | findstr "ffmpeg version"
)

REM System test
echo.
echo Running basic system test...
python -c "import sys; print(f'Python {sys.version}'); import platform; print(f'OS: {platform.system()} {platform.version()}'); import psutil; print(f'RAM: {psutil.virtual_memory().total // (1024**3)} GB'); print('Basic test passed')"

echo.
echo ============================================
echo Installation complete!
echo.
echo To start the application:
echo   Double-click run.bat
echo   Or run: venv\Scripts\activate.bat ^&^& python -m backend.api.main
echo.
echo The app will open at http://127.0.0.1:7860
echo.
echo First-run setup:
echo 1. Open http://127.0.0.1:7860
echo 2. Check Settings for hardware info
echo 3. Go to Models page and download a model (requires internet)
echo 4. Recommended: procedural-dsp is built-in (no download needed)
echo 5. For best quality: stable-audio-open-1.0 for SFX, ace-step-3.5b for music
echo.
echo See README.md and MODEL_LICENSES.md for license info
echo ============================================
pause

@echo off
setlocal enabledelayedexpansion

echo ============================================
echo PKmusicgen - Professional Offline AI Music Generator
echo Windows Installation Script
 echo Real engine: ACE-Step 1.5
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.11 or 3.12.
    pause
    exit /b 1
)
python --version

REM ACE-Step 1.5 currently targets Python 3.11-3.12
python -c "import sys; raise SystemExit(0 if sys.version_info[:2] in [(3,11),(3,12)] else 1)"
if %errorlevel% neq 0 (
    echo [ERROR] ACE-Step 1.5 requires Python 3.11 or 3.12.
    echo Please install Python 3.11/3.12 and run this installer with that Python.
    pause
    exit /b 1
)

REM Create venv
if not exist venv (
    echo [1/7] Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create venv
        pause
        exit /b 1
    )
) else (
    echo [1/7] venv already exists.
)

call venv\Scripts\activate.bat

echo [2/7] Upgrading pip...
python -m pip install --upgrade pip

REM Install PyTorch
 echo [3/7] Detecting GPU and installing PyTorch...
nvidia-smi >nul 2>&1
if %errorlevel% equ 0 (
    echo NVIDIA GPU detected. Installing CUDA PyTorch...
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu128
) else (
    echo No NVIDIA GPU detected. Installing CPU PyTorch.
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
)

REM Install PKmusicgen dependencies
echo [4/7] Installing PKmusicgen dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
)

REM Install the real ACE-Step 1.5 package
 echo [5/7] Installing official ACE-Step 1.5 inference package...
pip install git+https://github.com/ACE-Step/ACE-Step-1.5.git
if %errorlevel% neq 0 (
    echo [ERROR] ACE-Step 1.5 installation failed.
    pause
    exit /b 1
)

REM Create directories
echo [6/7] Creating required directories...
if not exist models mkdir models
if not exist models\ace-step-1.5 mkdir models\ace-step-1.5
if not exist outputs mkdir outputs
if not exist samples mkdir samples
if not exist presets mkdir presets
if not exist logs mkdir logs
if not exist data mkdir data

REM Check FFmpeg
 echo [7/7] Checking FFmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] FFmpeg not found in PATH. Basic WAV export still works.
) else (
    echo FFmpeg found.
)

python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); import acestep; print('ACE-Step Python package: OK')"

 echo.
echo ============================================
echo Installation complete!
echo ============================================
echo.
echo IMPORTANT: The AI model weights are NOT bundled with GitHub.
echo.
echo 1. Start PKmusicgen with run.bat
 echo 2. Open the Models page
 echo 3. Download 'ACE-Step 1.5'
echo 4. Wait for the model download to finish (~10 GB for the core package)
echo 5. Generate music using the real AI model
 echo.
echo After the model is downloaded, generation can run offline.
echo Procedural DSP is retained only for testing and is NOT the normal generator.
echo.
pause

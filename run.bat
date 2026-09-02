@echo off
echo Starting PKmusicgen - Free Online & Offline AI Music Generator...

if not exist venv (
    echo Virtual environment not found. Running install_windows.bat first...
    call install_windows.bat
)

call venv\Scripts\activate.bat

REM Ensure required directories exist
if not exist models mkdir models
if not exist outputs mkdir outputs
if not exist samples mkdir samples
if not exist presets mkdir presets
if not exist logs mkdir logs
if not exist data mkdir data

echo Starting FastAPI server at http://127.0.0.1:7860
echo Press Ctrl+C to stop
echo.

REM Open browser automatically
start "" http://127.0.0.1:7860

python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 7860 --reload

pause

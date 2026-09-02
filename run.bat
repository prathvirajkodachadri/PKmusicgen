@echo off
echo Starting PKmusicgen...

if not exist venv (
    echo Virtual environment not found. Running install_windows.bat first...
    call install_windows.bat
)

call venv\Scripts\activate.bat

REM Check if frontend exists
if not exist frontend\index.html (
    echo [WARNING] Frontend not found, but API will still run
)

echo Starting FastAPI server at http://127.0.0.1:7860
echo Press Ctrl+C to stop
echo.

REM Open browser after 2 seconds
start "" http://127.0.0.1:7860

python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 7860 --reload

pause

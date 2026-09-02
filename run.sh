#!/bin/bash
echo "Starting PKmusicgen..."

# Check venv
if [ ! -d "venv" ]; then
    echo "Virtual environment not found, creating..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    # Detect CUDA
    if command -v nvidia-smi &> /dev/null; then
        echo "NVIDIA GPU detected, installing PyTorch CUDA"
        pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
    else
        echo "CPU mode"
        pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
    fi
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Create dirs
mkdir -p models outputs samples presets logs data

echo "Starting server at http://127.0.0.1:7860"
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 7860 --reload

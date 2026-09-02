#!/bin/bash
set -e

echo "=== Starting PKmusicgen Online AI Music Generator ==="

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-7860}"

# If venv exists, activate it
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Ensure required directories exist
mkdir -p models outputs samples presets logs data

echo "Starting server at http://${HOST}:${PORT}"
python3 -m uvicorn backend.api.main:app --host "${HOST}" --port "${PORT}"

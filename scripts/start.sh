#!/bin/bash

# Cleanup on exit
trap 'kill $(jobs -p) 2>/dev/null; exit' INT TERM EXIT

echo "====================================="
echo "       HALO IS RUNNING               "
echo "====================================="
echo "Backend: http://localhost:8000       "
echo "Frontend: http://localhost:5173      "
echo "====================================="

# 1. Activate backend venv
source backend/.venv/bin/activate

# FORCE OFFLINE MODE for HuggingFace (Prevents slow timeouts)
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1

# 2. Start uvicorn in background
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
cd ..

# 3. Start npm run dev in foreground
npm run dev

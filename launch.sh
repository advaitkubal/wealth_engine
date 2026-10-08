#!/bin/bash
# ==============================================================================
# Halo: One-Click Local Privacy Engine Launcher
# ==============================================================================

echo "🚀 Starting Halo 100% On-Device Financial Intelligence Engine..."

# 1. Setup and start Backend
if [ ! -d "backend/.venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv backend/.venv
    backend/.venv/bin/pip install --upgrade pip
    backend/.venv/bin/pip install -r backend/requirements.txt 2>/dev/null || backend/.venv/bin/pip install fastapi uvicorn pydantic pydantic-settings reportlab python-docx pypdf
fi

echo "✨ Starting Local API Server on http://127.0.0.1:8000..."
backend/.venv/bin/uvicorn app.main:app --reload --port 8000 --app-dir backend &
BACKEND_PID=$!

# 2. Setup and start Frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node dependencies..."
    npm install
fi

echo "🌐 Starting Local UI on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

echo "✅ Halo is running locally and completely private!"
echo "   Dashboard: http://localhost:5173"
echo "   Press Ctrl+C to stop both servers."

wait

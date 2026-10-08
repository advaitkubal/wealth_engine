#!/bin/bash
set -e

echo "Setting up Halo environment..."

# 1. Create venv if not exists
if [ ! -d "backend/.venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv backend/.venv
fi

# 2. Activate it
source backend/.venv/bin/activate

# 3. pip install
echo "Installing requirements..."
pip install -r backend/requirements.txt

# 4. Copy .env.example
if [ ! -f ".env" ]; then
    echo "Copying .env.example to .env..."
    cp .env.example .env
fi

# 5. Create directories
mkdir -p data/documents data/processed

# 6. Initialize DB
echo "Initializing database..."
python scripts/initialize_db.py

echo "Setup complete! Next steps:"
echo "1. Configure your LLM settings in the .env file."
echo "2. Run scripts/start.sh to start the application."

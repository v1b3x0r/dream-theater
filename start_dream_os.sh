#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎭 INITIALIZING DREAM THEATER FOR MACOS...${NC}"
echo "---------------------------------------"

# Get absolute path of current directory
PROJECT_ROOT=$(pwd)

# Try to find python3.13, fallback to python3
if command -v python3.13 &> /dev/null; then
    PYTHON_EXEC="python3.13"
else
    PYTHON_EXEC="python3"
fi

echo -e "Using Python: ${GREEN}$($PYTHON_EXEC --version)${NC}"

# --- BACKEND SETUP ---
echo -e "${YELLOW}⚙️  Checking Backend System...${NC}"
cd "$PROJECT_ROOT/system/backend"

# FORCE CLEANUP: Remove venv if it exists to prevent cache issues with numpy
if [ -d "venv" ]; then
    echo "🧹 Wiping old venv to ensure clean numpy install..."
    rm -rf venv
fi

# Create venv
echo "Creating Python virtual environment with $PYTHON_EXEC..."
$PYTHON_EXEC -m venv venv

# Activate venv and install requirements
source venv/bin/activate
echo "Installing/Updating backend dependencies..."
pip install --upgrade pip
# Force binary only for numpy to avoid compilation hell
pip install -r requirements.txt --only-binary=:all: || pip install -r requirements.txt
deactivate

# --- FRONTEND SETUP ---
echo -e "${YELLOW}🎨 Checking Frontend System...${NC}"
cd "$PROJECT_ROOT/system/frontend-app"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# --- LAUNCH SEQUENCE ---
echo "---------------------------------------"
echo -e "${GREEN}🚀 Launching Systems...${NC}"

# Launch Backend in a new Terminal tab
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT/system/backend'; source venv/bin/activate; python3 -m app.main\""

# Launch Frontend in a new Terminal tab
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT/system/frontend-app'; npm run dev\""

echo -e "${BLUE}🛰️  Systems launched in new Terminal windows!${NC}"
echo "---------------------------------------"

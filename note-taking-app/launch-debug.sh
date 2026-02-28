#!/bin/bash

# Get the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo "Starting Qnex Debug Launch..."

# 1. Check if port 3001 is in use and kill it
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 3001 is in use. Clearing it..."
    lsof -ti:3001 | xargs kill -9
fi

# 2. Start backend server in a new terminal window
echo "Launching Backend Server in new terminal..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="Qnex Backend Server Logs" -- bash -c "cd '$PROJECT_ROOT/server' && node server.js; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -T "Qnex Backend Server Logs" -e "cd '$PROJECT_ROOT/server' && node server.js; exec bash" &
else
    echo "Warning: No supported terminal emulator (gnome-terminal, xterm) found. Starting backend in background..."
    cd "$PROJECT_ROOT/server" && node server.js &
fi

# 2. Wait for server to start
echo "Waiting for server to be ready on http://localhost:3001..."
MAX_RETRIES=30
COUNT=0
while ! curl -s http://localhost:3001/api/health > /dev/null; do
    sleep 1
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Server startup timed out. Proceeding anyway..."
        break
    fi
done

# 3. Start Electron frontend
echo "Launching Electron Frontend..."
cd "$PROJECT_ROOT"
npm run start

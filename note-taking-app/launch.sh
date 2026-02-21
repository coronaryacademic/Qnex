#!/bin/bash
# Launch Note Taking App on Linux

# Navigate to the script directory
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || exit

# Add standard binary paths
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

# Kill any stale server processes first
pkill -f "node server/server.js" 2>/dev/null
pkill -f "node server.js" 2>/dev/null
sleep 1

# Start the Backend Server (Port 3001)
echo "Starting Backend Server (Port 3001)..."
cd "$DIR/server" || exit
nohup node server.js > server.log 2>&1 &
cd "$DIR" || exit

# Wait for the backend server to be ready (up to 10 seconds)
echo "Waiting for server to be ready..."
for i in $(seq 1 10); do
    if lsof -Pi :3001 -sTCP:LISTEN -t > /dev/null 2>&1; then
        echo "Backend Server is ready!"
        break
    fi
    sleep 1
done

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Running npm install..."
    npm install
fi

# Launch the app
echo "Launching Note Taking App from $DIR..."
npm start -- --no-sandbox

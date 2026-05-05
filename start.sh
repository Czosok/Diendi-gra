#!/bin/bash
# D&D 5e RPG - Auto Launcher
# Run this script to start both client and server

echo "🎲 D&D 5e Tabletop RPG - Starting..."

# Get directory where script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if node_modules exist
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Build client
echo "🏗️ Building client..."
cd client && npm run build && cd ..

# Start server in background
echo "🚀 Starting server..."
cd server && node index.js > server.log 2>&1 &
SERVER_PID=$!
cd ..

echo "✅ Server started on port 3001"
echo "✅ Client built to static files"
echo ""
echo "🎮 Open http://localhost:3001 in your browser!"
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for interrupt
trap "kill $SERVER_PID 2>/dev/null; exit" SIGINT SIGTERM
wait $SERVER_PID
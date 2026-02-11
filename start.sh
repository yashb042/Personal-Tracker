#!/bin/bash

echo "🚀 Starting Personal Tracker..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
    cd client && npm install && cd ..
    echo ""
fi

echo "✅ Starting backend server on port 5002..."
echo "✅ Starting frontend on port 3000..."
echo ""
echo "🌐 Open http://localhost:3000 in your browser!"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
PORT=5002 npm run dev


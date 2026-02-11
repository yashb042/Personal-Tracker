#!/bin/bash

echo "🔍 Testing Personal Tracker Setup..."
echo ""

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "✅ Node.js is installed: $(node --version)"
else
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    echo "✅ npm is installed: $(npm --version)"
else
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo ""

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found"
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed. Run: npm install"
fi

# Check if client folder exists
if [ -d "client" ]; then
    echo "✅ Client folder found"

    if [ -d "client/node_modules" ]; then
        echo "✅ Frontend dependencies installed"
    else
        echo "⚠️  Frontend dependencies not installed. Run: cd client && npm install"
    fi
else
    echo "❌ Client folder not found"
fi

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "⚠️  .env file not found. Copy .env.example to .env and add your credentials."
fi

echo ""
echo "🎯 Setup Status:"
echo "=================="

if [ -d "node_modules" ] && [ -d "client/node_modules" ]; then
    echo "✅ All dependencies installed!"
    echo ""
    echo "🚀 Ready to start! Run one of:"
    echo "   npm run dev     (Development mode with hot reload)"
    echo "   npm start       (Production mode)"
else
    echo "⚠️  Some dependencies missing. Please run:"
    echo "   ./setup.sh"
    echo "   OR manually:"
    echo "   npm install && cd client && npm install"
fi

echo ""


#!/bin/bash

echo "🌐 Personal Tracker — GitHub Pages edition"
echo ""
echo "⚠️  Do NOT run server.js for daily tracking / Telegram."
echo "    Reminders run on GitHub Actions (see GITHUB_SETUP.md)."
echo ""
echo "📱 Telegram: type 'log' to track"
echo "🌍 Web:      https://yashb042.github.io/Personal-Tracker/"
echo ""
echo "Starting frontend only (local preview)..."
echo ""

if [ ! -d "client/node_modules" ]; then
  echo "📦 Installing client dependencies..."
  (cd client && npm install)
fi

cd client && npm start

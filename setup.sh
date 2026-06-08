#!/bin/bash
# SentinelAI Setup Script — Level 1
set -e

echo ""
echo "🛡️  SentinelAI — Setup & Launch"
echo "================================"

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 not found. Install Python 3.11+"; exit 1; }
command -v node    >/dev/null 2>&1 || { echo "❌ Node.js not found. Install Node.js 18+"; exit 1; }
command -v npm     >/dev/null 2>&1 || { echo "❌ npm not found."; exit 1; }

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo ""
echo "📦 Setting up Python virtual environment..."
cd "$BACKEND_DIR"
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate

echo "📥 Installing backend dependencies..."
pip install -q -r requirements.txt

echo ""
echo "📥 Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --silent

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting SentinelAI..."
echo ""

# Start MongoDB (optional — skip if using Atlas)
if command -v mongod &>/dev/null; then
  echo "🍃 Starting local MongoDB..."
  mongod --fork --logpath /tmp/mongod.log --dbpath /tmp/mongodb || true
elif command -v docker &>/dev/null; then
  echo "🐳 Starting MongoDB via Docker..."
  docker run -d --name sentinelai-mongo -p 27017:27017 mongo:7 2>/dev/null || docker start sentinelai-mongo 2>/dev/null || true
else
  echo "⚠️  MongoDB not found locally — the backend will still start but data won't persist."
fi

# Start backend in background
echo ""
echo "⚡ Starting FastAPI backend on http://localhost:8000..."
cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

sleep 2

# Start frontend
echo ""
echo "🎨 Starting React frontend on http://localhost:5173..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "════════════════════════════════════════"
echo "  🛡️  SentinelAI is LIVE!"
echo "════════════════════════════════════════"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo "════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# Wait and cleanup on exit
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait

#!/usr/bin/env bash
# InsureAI — Quick Start Script
set -e

echo ""
echo "🛡  InsureAI Platform — Setup & Start"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Ollama
if command -v ollama &>/dev/null; then
  echo "✅ Ollama found"
  echo "   Make sure llama3.2 is pulled: ollama pull llama3.2"
else
  echo "⚠️  Ollama not found. Install from https://ollama.com"
  echo "   Then run: ollama pull llama3.2"
fi

echo ""
echo "📦 Installing dependencies..."

cd server
npm install --silent
cd ../client
npm install --silent
cd ..

echo ""
echo "🚀 Starting servers..."
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Demo logins:"
echo "  Admin:       admin@insureai.co.ke / admin123"
echo "  Adjuster:    adjuster@insureai.co.ke / adj123"
echo "  Underwriter: uw@insureai.co.ke / uw123"
echo "  Broker:      broker@insureai.co.ke / broker123"
echo "  Customer:    customer@insureai.co.ke / cust123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start backend in background
cd server && node index.js &
SERVER_PID=$!
cd ..

# Wait for server
sleep 2

# Start frontend (foreground)
cd client
BROWSER=none npm start

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT

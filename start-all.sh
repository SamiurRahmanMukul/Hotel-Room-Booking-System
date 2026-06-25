#!/bin/bash

echo "🚀 Starting Hotel Room Booking System Services..."

# Trap SIGINT (Ctrl+C) to gracefully shut down all background processes
trap 'echo -e "\n🛑 Stopping all services..."; kill $(jobs -p) 2>/dev/null; exit' SIGINT SIGTERM

echo "[-] Starting Backend (Port 8000)..."
(cd backend && npm run dev) &

echo "[-] Starting Admin Panel (Port 3001)..."
(cd admin-panel && BROWSER=none npm start) &

echo "[-] Starting Public Frontend (Port 3034)..."
(cd frontend && npm run dev) &

echo "[-] Starting Calendar Sync Worker (Port 8001)..."
(cd calendar-sync-worker && npm run dev) &

echo "✅ All services are spinning up in the background!"
echo "💡 Press Ctrl+C at any time to stop all of them together."
echo "--------------------------------------------------------"

# Wait for all background jobs to finish
wait

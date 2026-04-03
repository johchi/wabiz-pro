#!/bin/bash

echo "🔄 Restarting WaBiz Pro System..."

# Stop backend
echo "Stopping backend..."
pkill -f "node index-postgres.js" || true

# Wait a moment
sleep 2

# Start backend
echo "Starting backend..."
cd /Users/johnchihule/Desktop/wabiz-pro-starter/backend
node index-postgres.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 3

# Check if frontend is running, if not start it
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Starting frontend..."
    cd /Users/johnchihule/Desktop/wabiz-pro-starter/frontend
    npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
else
    echo "Frontend already running"
fi

echo ""
echo "✅ System restarted successfully!"
echo "📱 Access at: http://localhost:3000"
echo "🔑 Login: test@example.com / password123"
echo ""
echo "📝 View logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
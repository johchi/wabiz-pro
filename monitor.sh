#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 WaBiz Pro System Monitor"
echo "============================"
echo ""

# Check Backend
echo -n "Backend Status: "
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check Frontend
echo -n "Frontend Status: "
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check Database
echo -n "Database Status: "
if pg_isready -q; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Disconnected${NC}"
fi

# Get System Stats
echo ""
echo "📊 System Statistics:"
echo "======================"

# Database stats
DB_STATS=$(psql -d wabiz_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
echo "👥 Total Users: ${DB_STATS:-0}"

# Payment stats
PAYMENT_STATS=$(psql -d wabiz_db -t -c "SELECT COUNT(*) FROM payments WHERE status='completed';" 2>/dev/null | tr -d ' ')
echo "💰 Total Payments: ${PAYMENT_STATS:-0}"

# Subscription stats
SUB_STATS=$(psql -d wabiz_db -t -c "SELECT COUNT(*) FROM subscriptions WHERE status='active';" 2>/dev/null | tr -d ' ')
echo "📋 Active Subscriptions: ${SUB_STATS:-0}"

# Server uptime
UPTIME=$(uptime | awk -F 'up ' '{print $2}' | awk -F ',' '{print $1}')
echo "⏱️  Server Uptime: $UPTIME"

echo ""
echo "💡 Tip: Run './monitor.sh --watch' for real-time monitoring"
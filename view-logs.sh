#!/bin/bash

echo "📋 WaBiz Pro Log Viewer"
echo "======================="
echo ""
echo "Select log to view:"
echo "1) Backend Log"
echo "2) Frontend Log"
echo "3) Database Log"
echo "4) All Logs (tail)"
echo ""

read -p "Choice (1-4): " choice

case $choice in
    1)
        if [ -f backend.log ]; then
            tail -f backend.log
        else
            echo "No backend log found. Starting backend to generate logs..."
            cd backend && node index-postgres.js
        fi
        ;;
    2)
        if [ -f frontend.log ]; then
            tail -f frontend.log
        else
            echo "No frontend log found"
        fi
        ;;
    3)
        tail -f /usr/local/var/log/postgresql@15.log
        ;;
    4)
        echo "Showing all logs (press Ctrl+C to stop)"
        tail -f backend.log frontend.log /usr/local/var/log/postgresql@15.log 2>/dev/null
        ;;
    *)
        echo "Invalid choice"
        ;;
esac
#!/bin/bash

# Firebase Deployment Monitor
# Run this to check the current deployment status

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║              🔍 FIREBASE DEPLOYMENT MONITOR                                ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if deployment process is running
PROCESS=$(ps aux | grep "firebase deploy" | grep -v grep | grep -v monitor)

if [ -z "$PROCESS" ]; then
    echo "❌ No deployment process found running"
    echo ""
    echo "Checking last deployment status..."
    echo ""
    
    # Check hosting status
    export PATH="/opt/homebrew/bin:$PATH"
    firebase hosting:channel:list 2>/dev/null | grep -A 1 "live"
    
    echo ""
    echo "Last 20 lines of deployment log:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -20 firebase-deploy.log 2>/dev/null || echo "No log file found"
else
    echo "✅ Deployment process is RUNNING"
    echo ""
    echo "Process Info:"
    echo "$PROCESS"
    echo ""
    echo "Current Progress (last 15 lines):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -15 firebase-deploy.log
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Run this script again to check progress: ./monitor-deployment.sh"

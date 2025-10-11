#!/bin/bash
# Automated Firebase Deployment Script
# Run this with: bash deploy.sh

echo "🚀 Starting Firebase Deployment..."
echo "📦 Using pre-built files from npm run build"
echo "⏰ This will take 5-10 minutes - please be patient"
echo ""

export PATH="/opt/homebrew/bin:$PATH"

echo "📋 Deploying to Firebase Hosting..."
npx firebase-tools deploy --only hosting

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🌐 Your app is live at: https://formgenai-4545.web.app"
    echo ""
    echo "🧪 Test the fix:"
    echo "1. Go to: https://formgenai-4545.web.app/admin/services/2F3GSb5UJobtRzU9Vjvv"
    echo "2. Open browser console (F12)"
    echo "3. Click 'Regenerate Documents'"
    echo "4. Watch for: 🔄 Refreshed service data: log"
    echo "5. Verify: Download buttons turn blue within 1-3 seconds!"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Please check the error messages above"
    exit 1
fi

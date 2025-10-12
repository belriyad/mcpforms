#!/bin/bash

# ==============================================================================
# SIMPLE DEPLOYMENT SCRIPT - RUN THIS TO DEPLOY YOUR BUG FIXES
# ==============================================================================

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════════════"
echo "           🚀 DEPLOYING BUG FIXES TO PRODUCTION"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Fixes to be deployed:"
echo "   1. intakeForms Firestore Rules (ALREADY LIVE)"
echo "   2. Enhanced AI Section Error Logging (NEEDS DEPLOYMENT)"
echo ""
echo "⏳ This will take 3-5 minutes. Please do not interrupt."
echo ""

# Set PATH
export PATH="/opt/homebrew/bin:$PATH"

# Navigate to project directory
cd "$(dirname "$0")"

# Deploy
echo "📦 Starting Firebase deployment..."
echo ""

npx firebase-tools deploy --only hosting

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════════════════"
    echo "                  ✅ DEPLOYMENT SUCCESSFUL!"
    echo "════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "🎉 Your fixes are now LIVE at:"
    echo "   https://formgenai-4545.web.app"
    echo ""
    echo "🧪 TESTING INSTRUCTIONS:"
    echo ""
    echo "   1️⃣  TEST INTAKE FORMS:"
    echo "      URL: https://formgenai-4545.web.app/admin/intakes"
    echo "      Expected: Page loads (or shows empty state if no data)"
    echo ""
    echo "   2️⃣  TEST AI SECTION ERRORS:"
    echo "      URL: https://formgenai-4545.web.app/admin/services/{serviceId}"
    echo "      Steps:"
    echo "        a) Click 'Add AI Section' button"
    echo "        b) Fill in placeholder and prompt"
    echo "        c) Open Browser Console (Press F12)"
    echo "        d) Click 'Generate AI Section'"
    echo "        e) Check console for DETAILED error messages"
    echo ""
    echo "   You should now see:"
    echo "      🤖 Generating AI section... {details}"
    echo "      📥 AI Generation Response: {full response}"
    echo "      ❌ Specific error (not generic message)"
    echo ""
    echo "════════════════════════════════════════════════════════════════════════"
else
    echo ""
    echo "════════════════════════════════════════════════════════════════════════"
    echo "                  ❌ DEPLOYMENT FAILED"
    echo "════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "  - Not logged into Firebase: run 'npx firebase-tools login'"
    echo "  - Wrong project: run 'npx firebase-tools use formgenai-4545'"
    echo "  - Network issues: check your internet connection"
    echo ""
    exit 1
fi

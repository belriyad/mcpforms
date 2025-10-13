#!/bin/bash

# Environment Variables Helper for Vercel Deployment
# This script helps you configure environment variables in Vercel

echo "🔧 Environment Variables Configuration Helper"
echo "=============================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your Firebase and OpenAI credentials."
    exit 1
fi

echo "✅ Found .env.local file"
echo ""

echo "📋 Required Environment Variables:"
echo "==================================="
echo ""

# List of required variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_CLIENT_EMAIL"
    "FIREBASE_PRIVATE_KEY"
    "OPENAI_API_KEY"
)

# Check each variable
MISSING_COUNT=0
for VAR in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${VAR}=" .env.local; then
        echo "✅ $VAR (found)"
    else
        echo "❌ $VAR (MISSING)"
        ((MISSING_COUNT++))
    fi
done

echo ""

if [ $MISSING_COUNT -gt 0 ]; then
    echo "⚠️  Warning: $MISSING_COUNT required variable(s) missing!"
    echo "Please add them to .env.local before deploying."
    echo ""
fi

echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Open Vercel Dashboard:"
echo "   https://vercel.com/belals-projects-3ca41d5a/mcpforms/settings/environment-variables"
echo ""
echo "2. For each variable above, click 'Add New' and:"
echo "   - Paste the variable name"
echo "   - Copy value from .env.local"
echo "   - Select: Production, Preview, Development"
echo "   - Click 'Save'"
echo ""
echo "⚠️  SPECIAL NOTE for FIREBASE_PRIVATE_KEY:"
echo "   - Copy the ENTIRE value including quotes"
echo "   - Keep all the \\n characters"
echo "   - Should look like: \"-----BEGIN PRIVATE KEY-----\\n...\""
echo ""
echo "3. After adding all variables, redeploy:"
echo "   vercel --prod"
echo ""
echo "💡 TIP: You can also use the Vercel CLI:"
echo "   vercel env add VARIABLE_NAME production"
echo ""

# Offer to open Vercel dashboard
read -p "Would you like to open the Vercel dashboard now? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening Vercel dashboard..."
    open "https://vercel.com/belals-projects-3ca41d5a/mcpforms/settings/environment-variables" 2>/dev/null || \
    xdg-open "https://vercel.com/belals-projects-3ca41d5a/mcpforms/settings/environment-variables" 2>/dev/null || \
    echo "Please open: https://vercel.com/belals-projects-3ca41d5a/mcpforms/settings/environment-variables"
fi

echo ""
echo "✅ Configuration check complete!"

#!/bin/bash

# Production Test Runner
# Runs automated tests against the production environment

echo "🧪 Running Production Sanity Checks..."
echo ""

# Check if .env.test exists
if [ ! -f .env.test ]; then
    echo "⚠️  Warning: .env.test not found"
    echo "Copy .env.test.example to .env.test and add your credentials"
    echo ""
fi

# Run the tests
echo "Running Playwright tests against https://formgenai-4545.web.app"
echo ""

# Run tests with environment variables
export PWDEBUG=0

# Run all production sanity checks
npx playwright test tests/production-sanity-check.spec.ts \
  --reporter=list \
  --workers=1 \
  "$@"

echo ""
echo "✅ Tests complete!"
echo ""
echo "📊 View detailed report: npx playwright show-report"
echo "🎬 View traces: npx playwright show-trace trace.zip"

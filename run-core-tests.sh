#!/bin/bash

# Core Scenarios Test Runner
# Quick script to run all core E2E tests

export PATH="/opt/homebrew/bin:$PATH"

echo "🧪 Running Core Scenarios Tests..."
echo "=================================="
echo ""

# Run tests with list reporter for detailed output
npx playwright test tests/core-scenarios.spec.ts \
  --project=chromium \
  --reporter=list \
  --workers=1

echo ""
echo "=================================="
echo "✅ Test run complete!"
echo ""
echo "📊 View detailed report:"
echo "   npx playwright show-report"
echo ""
echo "📸 View screenshots:"
echo "   open test-results/"
echo ""

#!/bin/bash

# E2E Document Generation Test Runner
# This script runs the document generation test with proper setup

echo "🚀 E2E Document Generation Test Runner"
echo "========================================"
echo ""

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
  echo "❌ Error: .env.test file not found"
  echo "   Please create .env.test with your credentials"
  exit 1
fi

# Check if TEST_USER_EMAIL is set
if ! grep -q "TEST_USER_EMAIL" .env.test; then
  echo "❌ Error: TEST_USER_EMAIL not set in .env.test"
  exit 1
fi

# Show configuration
echo "📋 Configuration:"
echo "   Email: $(grep TEST_USER_EMAIL .env.test | cut -d'=' -f2)"
echo "   Service: $(grep TEST_SERVICE_ID .env.test | cut -d'=' -f2)"
echo ""

# Ask which test to run
echo "Which test would you like to run?"
echo "  1) Scenario 7 only (Generate & Download)"
echo "  2) Complete Workflow (All 9 steps)"
echo "  3) All scenarios (7 tests)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "🎯 Running Scenario 7: Generate & Download Document"
    echo "   This will test document generation and download"
    echo ""
    npx playwright test tests/core-scenarios.spec.ts --grep "Scenario 7" --headed --project=chromium
    ;;
  2)
    echo ""
    echo "🎯 Running Complete Workflow (9 steps)"
    echo "   This includes login → service → intake → generate → download"
    echo ""
    npx playwright test "COMPLETE WORKFLOW" --headed --project=chromium
    ;;
  3)
    echo ""
    echo "🎯 Running All 7 Scenarios"
    echo "   This will run all individual test scenarios"
    echo ""
    npx playwright test tests/core-scenarios.spec.ts --headed --project=chromium --workers=1
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "================================"
echo "📊 Test completed!"
echo ""
echo "📁 Check results:"
echo "   Screenshots: test-results/*.png"
echo "   Downloads: test-results/downloads/"
echo "   Videos: test-results/*/video.webm"
echo ""
echo "📈 View HTML report:"
echo "   npx playwright show-report"
echo ""

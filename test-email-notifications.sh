#!/bin/bash

# Quick Email Notification Test Script
# This script tests the email notifications in dev mode

echo "🧪 Email Notification Test - Dev Mode"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Prerequisites:${NC}"
echo "✓ Dev server running (npm run dev)"
echo "✓ Firebase Admin SDK initialized"
echo "✓ Test service with intake form created"
echo ""

echo -e "${BLUE}Test Steps:${NC}"
echo ""

echo -e "${YELLOW}1. Test Intake Submission Email:${NC}"
echo "   a. Navigate to: http://localhost:3000/intake/[your-token]"
echo "   b. Fill out the intake form"
echo "   c. Click 'Submit'"
echo "   d. Check terminal for:"
echo "      📧 ============ EMAIL (DEV MODE) ============"
echo "      📬 To: lawyer@example.com"
echo "      📝 Subject: New Client Intake Submission - [Client Name]"
echo "      💡 DEV MODE: Email not actually sent"
echo ""

echo -e "${YELLOW}2. Test Document Ready Email:${NC}"
echo "   a. Navigate to: http://localhost:3000/admin/services/[service-id]"
echo "   b. Click 'Generate Documents'"
echo "   c. Wait for generation to complete"
echo "   d. Check terminal for:"
echo "      📧 ============ EMAIL (DEV MODE) ============"
echo "      📬 To: client@example.com"
echo "      📝 Subject: Your Documents are Ready - [Service Name]"
echo "      💡 DEV MODE: Email not actually sent"
echo ""

echo -e "${YELLOW}3. Verify Activity Logs:${NC}"
echo "   a. Navigate to: http://localhost:3000/admin/activity"
echo "   b. Look for 'Email sent' entries"
echo "   c. Verify 'devMode: true' in the logs"
echo "   d. Check email templates and recipients are correct"
echo ""

echo -e "${GREEN}Expected Results:${NC}"
echo "✓ No actual emails sent (dev mode)"
echo "✓ Console logs show email content"
echo "✓ Activity logs record email attempts"
echo "✓ Branding applied if configured"
echo "✓ No errors in terminal"
echo ""

echo -e "${BLUE}Troubleshooting:${NC}"
echo "• If no console logs: Check NODE_ENV and EMAIL_PROVIDER env vars"
echo "• If errors: Check Firebase Admin initialization"
echo "• If no activity logs: Check Firestore rules for activityLogs collection"
echo ""

echo -e "${GREEN}To test production emails (optional):${NC}"
echo "1. Configure SendGrid or AWS SES"
echo "2. Set environment variables:"
echo "   NODE_ENV=production"
echo "   EMAIL_PROVIDER=sendgrid  # or 'ses'"
echo "   SENDGRID_API_KEY=your-key"
echo "   SENDGRID_FROM_EMAIL=noreply@yourdomain.com"
echo "3. Deploy to Vercel or run locally"
echo "4. Verify domain in email provider"
echo "5. Repeat tests above"
echo ""

echo "✅ Ready to test! Follow the steps above."

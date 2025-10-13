#!/bin/bash

# MCPForms Vercel Deployment Script
# Run this to deploy your MVP to production

set -e  # Exit on error

echo "🚀 MCPForms Deployment to Vercel"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Verify build
echo -e "${BLUE}Step 1: Verifying build...${NC}"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed. Please fix errors first.${NC}"
    exit 1
fi
echo ""

# Step 2: Check Git status
echo -e "${BLUE}Step 2: Checking Git status...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓ Git repository clean${NC}"
else
    echo -e "${YELLOW}⚠️  Uncommitted changes found. Committing...${NC}"
    git add -A
    git commit -m "chore: Pre-deployment commit - $(date +%Y-%m-%d)"
    git push origin main
    echo -e "${GREEN}✓ Changes committed and pushed${NC}"
fi
echo ""

# Step 3: Environment variables reminder
echo -e "${BLUE}Step 3: Environment Variables${NC}"
echo -e "${YELLOW}You'll need to configure these in Vercel Dashboard:${NC}"
echo ""
echo "Required variables (from your .env.local):"
echo "  - NEXT_PUBLIC_FIREBASE_API_KEY"
echo "  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "  - NEXT_PUBLIC_FIREBASE_APP_ID"
echo "  - FIREBASE_PROJECT_ID"
echo "  - FIREBASE_CLIENT_EMAIL"
echo "  - FIREBASE_PRIVATE_KEY"
echo "  - OPENAI_API_KEY"
echo "  - NEXT_PUBLIC_APP_URL (will be your Vercel URL)"
echo ""
echo "Optional (for email):"
echo "  - EMAIL_PROVIDER (set to 'console' for dev mode)"
echo ""
read -p "Press ENTER to continue once you've noted these..."
echo ""

# Step 4: Vercel login
echo -e "${BLUE}Step 4: Logging into Vercel...${NC}"
echo -e "${YELLOW}A browser window will open. Follow the authentication steps.${NC}"
echo ""
vercel login
echo ""

# Step 5: Initial deployment (preview)
echo -e "${BLUE}Step 5: Creating preview deployment...${NC}"
echo -e "${YELLOW}This will deploy to a preview URL first for testing.${NC}"
echo ""
vercel
echo ""

# Step 6: Environment variables setup
echo -e "${BLUE}Step 6: Configure Environment Variables${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to: Settings → Environment Variables"
echo "4. Add all variables from .env.local"
echo "5. Make sure to select: Production, Preview, and Development"
echo ""
read -p "Press ENTER once you've configured environment variables..."
echo ""

# Step 7: Production deployment
echo -e "${BLUE}Step 7: Deploying to production...${NC}"
echo -e "${YELLOW}This will deploy to your production domain.${NC}"
echo ""
read -p "Ready to deploy to production? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
    echo ""
    echo -e "${GREEN}✓ Production deployment complete!${NC}"
else
    echo -e "${YELLOW}Deployment cancelled. Run 'vercel --prod' when ready.${NC}"
    exit 0
fi
echo ""

# Step 8: Post-deployment checklist
echo -e "${BLUE}Step 8: Post-Deployment Testing${NC}"
echo -e "${YELLOW}Test these features in your production URL:${NC}"
echo ""
echo "Core Workflow:"
echo "  ☐ Sign up / Login"
echo "  ☐ Create a service"
echo "  ☐ Upload a template"
echo "  ☐ Generate intake form"
echo "  ☐ Submit intake (use incognito window)"
echo "  ☐ Generate documents"
echo "  ☐ Download document"
echo ""
echo "New Features:"
echo "  ☐ Save a prompt (/admin/prompts)"
echo "  ☐ Upload branding (/admin/settings/branding)"
echo "  ☐ Check activity logs (/admin/activity)"
echo ""
echo -e "${GREEN}Deployment Complete! 🎉${NC}"
echo ""
echo -e "${BLUE}Your production URL:${NC}"
vercel domains ls | grep -i production || echo "Check Vercel dashboard for your URL"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test the core workflow"
echo "2. Invite 3-5 beta users"
echo "3. Monitor Vercel dashboard"
echo "4. Check activity logs at /admin/activity"
echo "5. Review Vercel logs: vercel logs --follow"
echo ""
echo -e "${GREEN}Good luck with your launch! 🚀${NC}"

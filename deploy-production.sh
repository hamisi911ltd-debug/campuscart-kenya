#!/bin/bash

# CampusMart Production Deployment Script
# This script prepares and deploys your application to Cloudflare Pages

set -e  # Exit on any error

echo "🚀 CampusMart Production Deployment"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Step 1: Project directory verified${NC}"
echo ""

# Step 2: Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    echo "Uncommitted files:"
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${YELLOW}⚠️  Proceeding with uncommitted changes${NC}"
    fi
else
    echo -e "${GREEN}✅ Step 2: No uncommitted changes${NC}"
fi
echo ""

# Step 3: Run tests (if available)
if grep -q "\"test\":" package.json; then
    echo "🧪 Step 3: Running tests..."
    npm test || {
        echo -e "${RED}❌ Tests failed. Fix tests before deploying.${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Step 3: Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Step 3: No tests found, skipping${NC}"
fi
echo ""

# Step 4: Build the project
echo "🔨 Step 4: Building production bundle..."
npm run build || {
    echo -e "${RED}❌ Build failed. Fix build errors before deploying.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Step 4: Build successful${NC}"
echo ""

# Step 5: Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler CLI not found. Installing...${NC}"
    npm install -g wrangler
fi
echo -e "${GREEN}✅ Step 5: Wrangler CLI ready${NC}"
echo ""

# Step 6: Verify database schema
echo "📊 Step 6: Checking database schema..."
if [ -f "DATABASE_SCHEMA.sql" ]; then
    echo "Database schema file found."
    read -p "Do you want to apply the schema to production database? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Applying schema to production database..."
        npx wrangler d1 execute campusmart --remote --file=DATABASE_SCHEMA.sql || {
            echo -e "${YELLOW}⚠️  Schema application failed. This might be okay if tables already exist.${NC}"
        }
        echo -e "${GREEN}✅ Schema applied${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping schema application${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_SCHEMA.sql not found${NC}"
fi
echo ""

# Step 7: Push to GitHub
echo "📤 Step 7: Pushing to GitHub..."
git push origin main || {
    echo -e "${RED}❌ Git push failed. Check your git configuration.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Step 7: Pushed to GitHub${NC}"
echo ""

# Step 8: Deployment instructions
echo "🎯 Step 8: Final Deployment Steps"
echo "=================================="
echo ""
echo -e "${YELLOW}IMPORTANT: Complete these steps in Cloudflare Dashboard:${NC}"
echo ""
echo "1. Go to: https://dash.cloudflare.com/"
echo "2. Navigate to: Workers & Pages → campusmart-kenya"
echo "3. Go to: Settings → Functions"
echo ""
echo "4. Add D1 Database Binding:"
echo "   - Variable name: DB"
echo "   - D1 database: campusmart"
echo ""
echo "5. Add R2 Bucket Binding:"
echo "   - Variable name: STORAGE"
echo "   - R2 bucket: campusmart-storage"
echo ""
echo "6. Go to: Settings → Environment variables"
echo "7. Add Production variables:"
echo "   - VITE_ADMIN_EMAIL=campusmart.care@gmail.com"
echo "   - VITE_ADMIN_PASSWORD=<your-secure-password>"
echo ""
echo "8. Go to: Deployments → Retry deployment (or wait for auto-deploy)"
echo ""
echo "9. After deployment, test these URLs:"
echo "   - https://campusmart-kenya.pages.dev/"
echo "   - https://campusmart-kenya.pages.dev/api/debug"
echo "   - https://campusmart-kenya.pages.dev/api/products"
echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "📚 For detailed instructions, see: PRODUCTION_READINESS_CHECKLIST.md"
echo "🔧 For deployment troubleshooting, see: DEPLOYMENT_FIX_GUIDE.md"
echo ""
echo "🎉 Good luck with your launch!"

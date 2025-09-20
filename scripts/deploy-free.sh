#!/bin/bash

echo "🚀 DEPLOYING HOTEL MANAGEMENT SYSTEM TO FREE TIER!"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git repo is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes. Committing them now...${NC}"
    git add .
    git commit -m "🚀 Preparing for deployment"
fi

echo -e "${BLUE}📡 Pushing to GitHub...${NC}"
git push origin develop

echo ""
echo -e "${GREEN}✅ Code is ready for deployment!${NC}"
echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo ""
echo "1. 🚂 DEPLOY BACKEND (Railway):"
echo "   • Go to: https://railway.app"
echo "   • Click 'New Project' → 'Deploy from GitHub repo'"
echo "   • Select your repository"
echo "   • Set Root Directory: /backend"
echo "   • Add MongoDB and Redis services"
echo ""
echo "2. ⚡ DEPLOY FRONTEND (Vercel):"
echo "   • Go to: https://vercel.com"
echo "   • Click 'New Project'"
echo "   • Import your repository"
echo "   • Set Root Directory: /frontend"
echo "   • Framework: Next.js"
echo ""
echo "3. 🔗 CONNECT THEM:"
echo "   • Get Railway backend URL"
echo "   • Add to Vercel env: NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app"
echo ""
echo -e "${YELLOW}📖 Full guide: ./DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}🎉 Total cost: $0/month${NC}"

# Open deployment URLs
if command -v open &> /dev/null; then
    echo ""
    echo "🌐 Opening deployment platforms..."
    open "https://railway.app"
    sleep 2
    open "https://vercel.com"
fi
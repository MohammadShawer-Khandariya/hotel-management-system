#!/bin/bash
# Quick Railway Deployment Script

echo "🚀 Deploying Hotel Management System to Railway..."

# Install Railway CLI if not installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "Please login to Railway when prompted..."
railway login

# Deploy Backend
echo "📦 Deploying Backend..."
cd backend
railway init --name hotel-management-backend
railway add mongodb redis
railway deploy

# Get backend URL
BACKEND_URL=$(railway status --json | jq -r '.deployments[0].url')
echo "Backend deployed at: $BACKEND_URL"

# Deploy Frontend
echo "🎨 Deploying Frontend..."
cd ../frontend
railway init --name hotel-management-frontend
railway env set NEXT_PUBLIC_API_URL=$BACKEND_URL
railway deploy

# Get frontend URL
FRONTEND_URL=$(railway status --json | jq -r '.deployments[0].url')

echo "✅ Deployment Complete!"
echo "🎉 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL: $BACKEND_URL"
echo "💡 Don't forget to seed your database!"
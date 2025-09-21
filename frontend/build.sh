#!/bin/bash

# Railway deployment script for frontend
echo "Starting Railway deployment for frontend..."

# Set NODE_ENV to production
export NODE_ENV=production

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build the application with standalone output
echo "Building application..."
pnpm build

# Verify standalone build exists
if [ ! -d ".next/standalone" ]; then
    echo "Error: Standalone build not found!"
    exit 1
fi

echo "Build completed successfully!"
echo "Standalone output ready for Docker deployment"
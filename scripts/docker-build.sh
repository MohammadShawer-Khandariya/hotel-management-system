#!/bin/bash
# Build and push to Docker Hub

# Build backend image
cd backend
docker build -t yourusername/hotel-backend:latest .
docker push yourusername/hotel-backend:latest

# Build frontend image
cd ../frontend
docker build -t yourusername/hotel-frontend:latest .
docker push yourusername/hotel-frontend:latest

echo "Images pushed to Docker Hub!"
echo "Backend: yourusername/hotel-backend:latest"
echo "Frontend: yourusername/hotel-frontend:latest"
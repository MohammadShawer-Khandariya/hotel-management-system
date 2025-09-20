#!/bin/bash
# Digital Ocean Deployment Script

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/YOUR_USERNAME/hotel-management-system.git
cd hotel-management-system

# Set environment variables
cat << EOF > .env
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/hotel_management
REDIS_URL=redis://redis:6379
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=secure_password_123
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3000
EOF

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Setup nginx reverse proxy
sudo apt install nginx -y
sudo tee /etc/nginx/sites-available/hotel-management << EOF
server {
    listen 80;
    server_name YOUR_DOMAIN.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/hotel-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d YOUR_DOMAIN.com

echo "Deployment complete! Visit https://YOUR_DOMAIN.com"
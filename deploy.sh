#!/bin/bash

# Shakti Project Deployment Script for Hostinger VPS
# Multi-tenant SaaS with wildcard subdomain support

set -e

echo "🚀 Starting Shakti deployment..."

# Configuration
APP_NAME="shakti"
DOMAIN="yourdomain.com"  # Replace with your actual domain
DEPLOY_DIR="/opt/$APP_NAME"
NODE_VERSION="18.x"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root"
   exit 1
fi

# Update system packages
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
log_info "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
log_info "Installing Nginx..."
sudo apt install -y nginx

# Install PM2 globally
log_info "Installing PM2..."
sudo npm install -g pm2

# Create deployment directory
log_info "Creating deployment directory..."
sudo mkdir -p $DEPLOY_DIR
sudo chown -R $USER:$USER $DEPLOY_DIR

# Copy project files (assuming you're running this from project directory)
log_info "Copying project files..."
cp -r . $DEPLOY_DIR/
cd $DEPLOY_DIR

# Install dependencies
log_info "Installing Node.js dependencies..."
npm ci --production

# Build the application
log_info "Building the application..."
npm run build

# Setup environment variables
log_info "Configuring environment..."
if [ ! -f .env ]; then
    cat > .env << EOL
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://shakti_user:your_password@localhost:5432/shakti_db
JWT_SECRET=your-super-secret-jwt-key-here
WILDCARD_DOMAIN=*.${DOMAIN}
MAIN_DOMAIN=${DOMAIN}
EOL
    log_warn "Please update .env file with your actual database credentials and JWT secret"
fi

# Configure Nginx for wildcard subdomains
log_info "Configuring Nginx for wildcard subdomains..."
sudo tee /etc/nginx/sites-available/$APP_NAME << EOL
# Main domain - SuperAdmin access
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Wildcard subdomain support
server {
    listen 80;
    server_name *.${DOMAIN};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Subdomain \$subdomain;
        proxy_cache_bypass \$http_upgrade;
    }
}

# API subdomain (optional)
server {
    listen 80;
    server_name api.${DOMAIN};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
log_info "Testing Nginx configuration..."
sudo nginx -t

# Setup SSL with Let's Encrypt (optional but recommended)
read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx

    log_info "Obtaining SSL certificates..."
    sudo certbot --nginx -d $DOMAIN -d *.$DOMAIN -d api.$DOMAIN

    # Setup auto-renewal
    sudo systemctl enable certbot.timer
fi

# Start the application with PM2
log_info "Starting application with PM2..."
pm2 start npm --name "$APP_NAME" -- run "serve"
pm2 save
pm2 startup

# Restart Nginx
log_info "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup firewall
log_info "Configuring firewall..."
sudo ufw allow 'OpenSSH'
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Setup log rotation
log_info "Configuring log rotation..."
sudo tee /etc/logrotate.d/$APP_NAME << EOL
$DEPLOY_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOL

# Create deployment info file
cat > $DEPLOY_DIR/DEPLOYMENT_INFO << EOL
Shakti Multi-Tenant SaaS Deployment
===================================

Domain: $DOMAIN
Deployed: $(date)
Node Version: $(node -v)
NPM Version: $(npm -v)
PM2 Process: $APP_NAME

Access URLs:
- SuperAdmin: http://$DOMAIN
- Company 1: http://techcorp.$DOMAIN
- Company 2: http://globallending.$DOMAIN
- Company 3: http://quickloans.$DOMAIN

To view logs: pm2 logs $APP_NAME
To restart: pm2 restart $APP_NAME
To stop: pm2 stop $APP_NAME
EOL

log_info "✅ Deployment completed successfully!"
log_info "📋 Deployment information saved to: $DEPLOY_DIR/DEPLOYMENT_INFO"
log_info ""
log_info "🌐 Access your application:"
log_info "   SuperAdmin Dashboard: http://$DOMAIN"
log_info "   TechCorp Finance: http://techcorp.$DOMAIN"
log_info "   Global Lending: http://globallending.$DOMAIN"
log_info "   QuickLoans Ltd: http://quickloans.$DOMAIN"
log_info ""
log_info "📊 PM2 Status: pm2 status"
log_info "📊 PM2 Logs: pm2 logs $APP_NAME"
log_info ""
log_warn "⚠️  Remember to:"
log_warn "   1. Update DNS wildcard record (*.$DOMAIN) to point to your VPS IP"
log_warn "   2. Update .env file with database credentials"
log_warn "   3. Setup database and run migrations"
log_warn "   4. Configure SSL certificates if needed"
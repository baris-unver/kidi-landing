#!/bin/bash
set -euo pipefail

# ============================================================================
# Server Setup Script for kidi-landing
# Run this ONCE on your DigitalOcean Droplet to:
#   1. Stop and remove WordPress (Apache/MySQL/PHP)
#   2. Install Node.js, PM2, Nginx
#   3. Clone the repo and start the app
#   4. Configure Nginx as a reverse proxy
#
# Usage:
#   ssh root@YOUR_SERVER_IP
#   bash <(curl -s https://raw.githubusercontent.com/baris-unver/kidi-landing/main/scripts/server-setup.sh)
#
# Or copy this file to the server and run:
#   chmod +x server-setup.sh && ./server-setup.sh
# ============================================================================

APP_DIR="/opt/kidi-landing"
DOMAIN="${1:-_}"  # Pass your domain as first arg, or _ for default

echo "=========================================="
echo "  kidi-landing Server Setup"
echo "=========================================="

# ── Step 1: Stop and remove WordPress stack ──
echo ""
echo "[1/6] Stopping and removing WordPress..."

# Stop services
systemctl stop apache2 2>/dev/null || true
systemctl stop mysql 2>/dev/null || true
systemctl stop mariadb 2>/dev/null || true

# Disable services
systemctl disable apache2 2>/dev/null || true
systemctl disable mysql 2>/dev/null || true
systemctl disable mariadb 2>/dev/null || true

# Remove WordPress files
rm -rf /var/www/html/wordpress 2>/dev/null || true
rm -rf /var/www/html/wp-* 2>/dev/null || true
rm -f /var/www/html/index.php 2>/dev/null || true
rm -f /var/www/html/xmlrpc.php 2>/dev/null || true

# Purge Apache and PHP
apt-get purge -y apache2 apache2-utils libapache2-mod-php* 2>/dev/null || true
apt-get purge -y php* 2>/dev/null || true

# Keep MySQL/MariaDB data intact but stop it (in case you need the data later)
systemctl stop mysql 2>/dev/null || true
systemctl stop mariadb 2>/dev/null || true

apt-get autoremove -y 2>/dev/null || true
echo "  WordPress stack removed."

# ── Step 2: Install Node.js ──
echo ""
echo "[2/6] Installing Node.js 20 LTS..."

if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "  Node.js $(node --version) installed."

# ── Step 3: Install PM2 ──
echo ""
echo "[3/6] Installing PM2..."

npm install -g pm2
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "  PM2 installed."

# ── Step 4: Clone repo and set up app ──
echo ""
echo "[4/6] Setting up application..."

if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone https://github.com/baris-unver/kidi-landing.git "$APP_DIR"
  cd "$APP_DIR"
fi

npm ci --production
npm run build

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "  *** IMPORTANT: Edit /opt/kidi-landing/.env with your real values ***"
  echo "  nano /opt/kidi-landing/.env"
  echo ""
fi

echo "  Application built."

# ── Step 5: Start with PM2 ──
echo ""
echo "[5/6] Starting application with PM2..."

cd "$APP_DIR"
pm2 delete kidi-landing 2>/dev/null || true
pm2 start server.js --name kidi-landing --env production
pm2 save
echo "  App running on port 3000."

# ── Step 6: Configure Nginx ──
echo ""
echo "[6/6] Configuring Nginx..."

apt-get install -y nginx

cat > /etc/nginx/sites-available/kidi-landing <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
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
NGINX

# Enable the site
ln -sf /etc/nginx/sites-available/kidi-landing /etc/nginx/sites-enabled/kidi-landing
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl enable nginx
systemctl restart nginx

echo ""
echo "=========================================="
echo "  Setup complete!"
echo "=========================================="
echo ""
echo "  App URL:    http://${DOMAIN}"
echo "  Admin URL:  http://${DOMAIN}/admin"
echo "  App dir:    ${APP_DIR}"
echo ""
echo "  Next steps:"
echo "  1. Edit .env:  nano ${APP_DIR}/.env"
echo "  2. Set these GitHub repo secrets for CI/CD:"
echo "     - SERVER_HOST     (your droplet IP)"
echo "     - SERVER_USER     (root or deploy user)"
echo "     - SERVER_SSH_KEY  (private SSH key)"
echo ""
echo "  3. (Optional) Set up SSL with Let's Encrypt:"
echo "     apt install certbot python3-certbot-nginx"
echo "     certbot --nginx -d yourdomain.com"
echo ""

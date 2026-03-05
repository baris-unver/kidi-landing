#!/bin/bash
set -euo pipefail

# ============================================================================
# Server Setup Script for kidi-landing (Docker)
# Run this ONCE on your DigitalOcean Droplet to:
#   1. Remove WordPress (Apache/MySQL/PHP) completely
#   2. Install Docker Engine + Compose plugin
#   3. Clone the repo
#   4. Obtain SSL certificate for kidi.ai
#   5. Start the app via docker compose
# ============================================================================

APP_DIR="/opt/kidi-landing"
DOMAIN="kidi.ai"

echo "=========================================="
echo "  kidi-landing Docker Setup"
echo "=========================================="

# ── Step 1: Remove WordPress stack completely ──
echo ""
echo "[1/6] Removing WordPress stack..."

systemctl stop apache2 2>/dev/null || true
systemctl stop mysql 2>/dev/null || true
systemctl stop mariadb 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true

systemctl disable apache2 2>/dev/null || true
systemctl disable mysql 2>/dev/null || true
systemctl disable mariadb 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

apt-get purge -y apache2 apache2-utils libapache2-mod-php* 2>/dev/null || true
apt-get purge -y php* 2>/dev/null || true
apt-get purge -y mysql-server mysql-client mysql-common mariadb-server mariadb-client mariadb-common 2>/dev/null || true
apt-get purge -y nginx nginx-common 2>/dev/null || true

rm -rf /var/www/html 2>/dev/null || true
rm -rf /var/lib/mysql 2>/dev/null || true
rm -rf /etc/mysql 2>/dev/null || true
rm -rf /etc/apache2 2>/dev/null || true
rm -rf /etc/nginx 2>/dev/null || true

apt-get autoremove -y
apt-get autoclean -y
echo "  Done."

# ── Step 2: Install Docker Engine ──
echo ""
echo "[2/6] Installing Docker..."

if ! command -v docker &>/dev/null; then
  apt-get update
  apt-get install -y ca-certificates curl gnupg

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable docker
systemctl start docker
echo "  Docker $(docker --version) installed."

# ── Step 3: Clone repository ──
echo ""
echo "[3/6] Cloning repository..."

apt-get install -y git 2>/dev/null || true

if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone https://github.com/baris-unver/kidi-landing.git "$APP_DIR"
  cd "$APP_DIR"
fi
echo "  Done."

# ── Step 4: Create .env ──
echo ""
echo "[4/6] Configuring environment..."

if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'ENVFILE'
ADMIN_PASSWORD=change-me-before-deploy
GITHUB_TOKEN=
GITHUB_REPO=baris-unver/kidi-landing
GITHUB_BRANCH=main
ENVFILE
  echo "  .env created. Edit it later: nano $APP_DIR/.env"
else
  echo "  .env already exists, skipping."
fi

# ── Step 5: Obtain SSL certificate ──
echo ""
echo "[5/6] Obtaining SSL certificate for ${DOMAIN}..."

apt-get install -y certbot 2>/dev/null || true

if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  certbot certonly --standalone --non-interactive --agree-tos \
    --email admin@${DOMAIN} \
    -d ${DOMAIN} -d www.${DOMAIN} || {
    echo "  SSL cert failed (domain might not point to this server yet)."
    echo "  Falling back to HTTP-only nginx config..."

    cat > "$APP_DIR/nginx/default.conf" <<'NGINXHTTP'
server {
    listen 80;
    server_name kidi.ai www.kidi.ai;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXHTTP
  }

  # Auto-renewal cron
  echo "0 3 * * * certbot renew --quiet --deploy-hook 'cd $APP_DIR && docker compose restart nginx'" \
    | crontab -
  echo "  SSL configured with auto-renewal."
else
  echo "  SSL cert already exists, skipping."
fi

# ── Step 6: Start containers ──
echo ""
echo "[6/6] Starting Docker containers..."

cd "$APP_DIR"
docker compose up -d --build
echo "  Containers started."

echo ""
echo "=========================================="
echo "  Setup complete!"
echo "=========================================="
echo ""
echo "  App URL:    https://${DOMAIN}"
echo "  Admin URL:  https://${DOMAIN}/admin"
echo "  App dir:    ${APP_DIR}"
echo ""
echo "  Manage:"
echo "    docker compose logs -f        # view logs"
echo "    docker compose restart        # restart"
echo "    docker compose down           # stop"
echo ""
echo "  Next: edit .env with your real values:"
echo "    nano ${APP_DIR}/.env"
echo "    docker compose restart app"
echo ""

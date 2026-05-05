#!/bin/bash
# Setup script for deploying Design AI 
# Run as root

set -euo pipefail

# --- CONFIGURATION ---
DOMAIN="your-domain.com"
APP_DIR="/root/design-ai" # Change this to your design-ai clone path
DATA_DIR="/root/design-ai-data"
NODE_VERSION="v24.15.0"
NODE_BIN="/root/.nvm/versions/node/${NODE_VERSION}/bin"
# ---------------------

if [ ! -f "${NODE_BIN}/pnpm" ]; then
    echo "Installing pnpm for Node ${NODE_VERSION}..."
    export PATH="${NODE_BIN}:${PATH}"
    npm install -g pnpm
fi

echo "========================================"
echo "   Design AI Server Setup"
echo "========================================"
echo "Domain:  ${DOMAIN}"
echo "Ports:   80 (HTTP) / 443 (HTTPS)"
echo "App Dir: ${APP_DIR}"
echo ""

# 1. Create data directory
mkdir -p "${DATA_DIR}"
echo "[OK] Data directory created: ${DATA_DIR}"

# 2. Build the web app
echo "Building web app..."
export PATH="${NODE_BIN}:${PATH}"
cd "${APP_DIR}"
pnpm --filter @open-design/web build
echo "[OK] Web app built."

# 3. Install nginx + certbot
if ! command -v nginx &>/dev/null; then
    apt-get update -qq
    apt-get install -y -qq nginx certbot
fi
echo "[OK] Nginx & Certbot ready."

# 4. Get SSL certificate 
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    certbot certonly --standalone -d "${DOMAIN}" --non-interactive --agree-tos -m "admin@${DOMAIN}"
fi
echo "[OK] SSL Certificate ready."

# 5. Configure nginx 
cp "${APP_DIR}/deploy/nginx-design-ai.conf" /etc/nginx/sites-available/design-ai
ln -sf /etc/nginx/sites-available/design-ai /etc/nginx/sites-enabled/design-ai
rm -f /etc/nginx/sites-enabled/default
sed -i "s/your-domain.com/${DOMAIN}/g" /etc/nginx/sites-available/design-ai
nginx -t && systemctl restart nginx
echo "[OK] Nginx configured."

# 6. Install systemd service
cp "${APP_DIR}/deploy/design-ai.service" /etc/systemd/system/design-ai.service
sed -i "s|/home/user/design-ai|${APP_DIR}|g" /etc/systemd/system/design-ai.service
sed -i "s|/home/user/design-ai-data|${DATA_DIR}|g" /etc/systemd/system/design-ai.service
systemctl daemon-reload
systemctl enable design-ai
systemctl restart design-ai
echo "[OK] Service installed and started."

echo "Setup Complete! The app is running on https://${DOMAIN}"

#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  sudo bash deploy/aws/bootstrap.sh --domain example.com [--email you@example.com] [--with-www] [--skip-ssl]

Options:
  --domain     Primary domain for nginx and HTTPS.
  --email      Email used by certbot. If omitted, HTTPS is skipped.
  --with-www   Also configure www.<domain>.
  --skip-ssl   Skip certbot even if --email is provided.
EOF
}

DOMAIN=""
EMAIL=""
WITH_WWW="0"
SKIP_SSL="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="${2:-}"
      shift 2
      ;;
    --email)
      EMAIL="${2:-}"
      shift 2
      ;;
    --with-www)
      WITH_WWW="1"
      shift
      ;;
    --skip-ssl)
      SKIP_SSL="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "--domain is required." >&2
  usage
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run this script with sudo." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
APP_USER="${SUDO_USER:-$(logname 2>/dev/null || echo ubuntu)}"
APP_GROUP="$(id -gn "${APP_USER}")"
SERVICE_NAME="surveys"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
NGINX_FILE="/etc/nginx/sites-available/${SERVICE_NAME}.conf"
NODE_MAJOR="22"
SESSION_SECRET="$(openssl rand -base64 48 | tr -d '\n' | tr '/+' '_-')"

SERVER_NAMES="${DOMAIN}"
CERTBOT_ARGS="-d ${DOMAIN}"
if [[ "${WITH_WWW}" == "1" ]]; then
  SERVER_NAMES="${DOMAIN} www.${DOMAIN}"
  CERTBOT_ARGS="${CERTBOT_ARGS} -d www.${DOMAIN}"
fi

echo "==> Installing system packages"
apt update
apt install -y nginx git curl certbot python3-certbot-nginx

echo "==> Installing Node.js ${NODE_MAJOR}"
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
apt install -y nodejs

echo "==> Installing dependencies"
cd "${APP_DIR}"
npm ci

echo "==> Building app"
npm run build

echo "==> Ensuring runtime directories exist"
mkdir -p "${APP_DIR}/data"
chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"

echo "==> Writing systemd service"
cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=Dostoevsky Soul Trial
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=OPEN_ACCESS=1
Environment=HOST=127.0.0.1
Environment=PORT=8787
Environment=SESSION_SECRET=${SESSION_SECRET}
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "==> Writing nginx config"
cat > "${NGINX_FILE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAMES};

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -sf "${NGINX_FILE}" "/etc/nginx/sites-enabled/${SERVICE_NAME}.conf"
rm -f /etc/nginx/sites-enabled/default

echo "==> Starting services"
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"
nginx -t
systemctl reload nginx

if [[ "${SKIP_SSL}" == "0" && -n "${EMAIL}" ]]; then
  echo "==> Requesting HTTPS certificate"
  certbot --nginx --non-interactive --agree-tos --redirect -m "${EMAIL}" ${CERTBOT_ARGS}
else
  echo "==> Skipping HTTPS setup"
  echo "   Run later:"
  echo "   sudo certbot --nginx --redirect -m <your-email> ${CERTBOT_ARGS}"
fi

echo
echo "Deployment finished."
echo "App directory: ${APP_DIR}"
echo "Service: ${SERVICE_NAME}"
echo "Domain(s): ${SERVER_NAMES}"
echo "Runtime user: ${APP_USER}"
echo "OPEN_ACCESS=1 is enabled."
echo
echo "Useful commands:"
echo "  sudo systemctl status ${SERVICE_NAME}"
echo "  sudo journalctl -u ${SERVICE_NAME} -n 100 --no-pager"
echo "  cd ${APP_DIR} && git pull && npm ci && npm run build && sudo systemctl restart ${SERVICE_NAME}"

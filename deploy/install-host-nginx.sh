#!/usr/bin/env bash
#
# install-host-nginx.sh — configure host nginx + Certbot for hebrai.co.
#
# Run as root on the VPS after the Docker app stack is available on
# 127.0.0.1:3000. The script installs a temporary HTTP-only vhost so
# Certbot can complete the HTTP-01 challenge, then replaces it with the
# final HTTPS reverse-proxy vhost.
#
set -euo pipefail

DOMAIN="${DOMAIN:-hebrai.co}"
EMAIL="${EMAIL:-CHANGE_ME@example.com}"
APP_PORT="${APP_PORT:-3000}"
WEBROOT="${WEBROOT:-/var/www/$DOMAIN}"
SITE_AVAILABLE="${SITE_AVAILABLE:-/etc/nginx/sites-available/$DOMAIN}"
SITE_ENABLED="${SITE_ENABLED:-/etc/nginx/sites-enabled/$DOMAIN}"

if [[ "$EMAIL" == *CHANGE_ME* ]]; then
  echo "ERROR: set EMAIL to the real certificate contact, e.g.:" >&2
  echo "  EMAIL=ops@example.com sudo bash deploy/install-host-nginx.sh" >&2
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: this script must run as root." >&2
  exit 1
fi

mkdir -p "$WEBROOT" "$WEBROOT/.well-known/acme-challenge"

cat > "$SITE_AVAILABLE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root $WEBROOT;
        allow all;
    }

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sfn "$SITE_AVAILABLE" "$SITE_ENABLED"
nginx -t
systemctl reload nginx

certbot certonly --webroot \
  --webroot-path "$WEBROOT" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --keep-until-expiring \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

cat > "$SITE_AVAILABLE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root $WEBROOT;
        allow all;
    }

    location / {
        return 301 https://$DOMAIN\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 180s;
        proxy_send_timeout 180s;
        proxy_connect_timeout 30s;
    }
}
EOF

nginx -t
systemctl reload nginx

echo "Host nginx is now serving https://$DOMAIN via 127.0.0.1:$APP_PORT"

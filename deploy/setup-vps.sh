#!/usr/bin/env bash
#
# setup-vps.sh — one-time provisioning for a fresh Ubuntu 24.04 VPS.
#
# Installs Docker + Certbot, clones the repo, obtains the initial TLS
# certificate, and installs renewal hooks.
#
# Certificate strategy: Certbot "standalone" authenticator for both initial
# issuance and renewal. Standalone needs port 80 free, so the renewal hooks
# briefly stop the nginx container (~5-15s) while Certbot binds the port, then
# start it again. Ubuntu's systemd certbot.timer drives the renewal schedule —
# no cron entry is added. A single authenticator keeps the issuance and the
# stored renewal config in agreement (avoids the standalone/webroot mismatch).
#
# Override any of the variables below via the environment, e.g.:
#   REPO=https://github.com/you/hebrai.co.git bash deploy/setup-vps.sh
#
set -euo pipefail

DOMAIN="${DOMAIN:-hebrai.co}"
EMAIL="${EMAIL:-hello@filipenegrao.com}"
REPO="${REPO:-https://github.com/CHANGE_ME/hebrai.co.git}"
APP_DIR="${APP_DIR:-/opt/hebrai}"

if [[ "$REPO" == *CHANGE_ME* ]]; then
  echo "ERROR: set REPO to the real repository URL, e.g.:" >&2
  echo "  REPO=https://github.com/you/hebrai.co.git bash deploy/setup-vps.sh" >&2
  exit 1
fi

echo "=== Installing Docker ==="
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "=== Installing Certbot ==="
apt-get install -y -qq certbot

echo "=== Cloning repo into $APP_DIR ==="
if [[ -d "$APP_DIR/.git" ]]; then
  echo "Repo already present at $APP_DIR — skipping clone."
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

echo "=== Obtaining initial SSL certificate (standalone — port 80 must be free) ==="
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo "=== Installing renewal hooks (stop/start nginx around renewal) ==="
mkdir -p /etc/letsencrypt/renewal-hooks/pre /etc/letsencrypt/renewal-hooks/post
cat > /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh <<EOF
#!/usr/bin/env bash
# Free port 80 so Certbot's standalone authenticator can bind it.
docker compose -f "$APP_DIR/docker-compose.yml" stop nginx || true
EOF
cat > /etc/letsencrypt/renewal-hooks/post/start-nginx.sh <<EOF
#!/usr/bin/env bash
# Bring nginx back up after renewal so it loads the refreshed certificate.
docker compose -f "$APP_DIR/docker-compose.yml" start nginx || true
EOF
chmod +x /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh \
         /etc/letsencrypt/renewal-hooks/post/start-nginx.sh

echo "=== Setting up .env ==="
if [[ -f .env ]]; then
  echo ".env already exists — leaving it untouched."
else
  cp .env.example .env
fi

echo ""
echo "ACTION REQUIRED:"
echo "  1. Edit $APP_DIR/.env and fill in real secrets (POSTGRES_PASSWORD,"
echo "     BETTER_AUTH_SECRET, provider API keys, etc)."
echo "  2. Run: cd $APP_DIR && bash deploy/deploy.sh"

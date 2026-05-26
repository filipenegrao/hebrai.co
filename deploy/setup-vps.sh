#!/usr/bin/env bash
#
# setup-vps.sh — one-time provisioning for a fresh Ubuntu 24.04 VPS.
#
# Installs Docker, clones the repo, and seeds the app directory. Public TLS is
# handled by the host nginx on this VPS family, not by a container-bound nginx.
# Run deploy/install-host-nginx.sh as root after the app stack is up so Certbot
# can issue certificates via host nginx + webroot.
#
# Override any of the variables below via the environment, e.g.:
#   REPO=https://github.com/you/hebrai.co.git bash deploy/setup-vps.sh
#
set -euo pipefail

DOMAIN="${DOMAIN:-hebrai.co}"
EMAIL="${EMAIL:-CHANGE_ME@example.com}"
REPO="${REPO:-https://github.com/CHANGE_ME/hebrai.co.git}"
APP_DIR="${APP_DIR:-/opt/hebrai}"

if [[ "$REPO" == *CHANGE_ME* ]]; then
  echo "ERROR: set REPO to the real repository URL, e.g.:" >&2
  echo "  REPO=https://github.com/you/hebrai.co.git bash deploy/setup-vps.sh" >&2
  exit 1
fi

if [[ "$EMAIL" == *CHANGE_ME* ]]; then
  echo "ERROR: set EMAIL to the real certificate contact, e.g.:" >&2
  echo "  EMAIL=ops@example.com REPO=https://github.com/you/hebrai.co.git bash deploy/setup-vps.sh" >&2
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

echo "=== Installing nginx + Certbot ==="
apt-get install -y -qq nginx certbot

echo "=== Cloning repo into $APP_DIR ==="
if [[ -d "$APP_DIR/.git" ]]; then
  echo "Repo already present at $APP_DIR — skipping clone."
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

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
echo "  2. Set BETTER_AUTH_URL=https://$DOMAIN and NEXT_PUBLIC_BETTER_AUTH_URL=https://$DOMAIN in $APP_DIR/.env."
echo "  3. Run: cd $APP_DIR && bash deploy/deploy.sh"
echo "  4. Run: cd $APP_DIR && bash deploy/migrate-auth.sh"
echo "  5. As root, run: cd $APP_DIR && EMAIL=$EMAIL bash deploy/install-host-nginx.sh"

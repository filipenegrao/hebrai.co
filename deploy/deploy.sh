#!/usr/bin/env bash
#
# deploy.sh — idempotent redeploy on the VPS.
#
# Brings the source in $APP_DIR up, rebuilds the app images, then starts the
# stack and fails loudly on an unhealthy backend.
#
# $APP_DIR may be either a git clone (the source is pulled) or a plain
# directory fed by deploy/push-deploy.sh from a workstation (the source is
# taken as-is). Public TLS lives in the host nginx on this VPS family, so
# the nginx container stays behind the container-edge compose profile.
#
set -euo pipefail

APP_DIR="${APP_DIR:-/home/filipe/apps/hebrai}"
COMPOSE_ARGS=(
  -f docker-compose.yml
)

if [[ -f docker-compose.vps-host-nginx.yml ]]; then
  COMPOSE_ARGS+=(-f docker-compose.vps-host-nginx.yml)
fi

cd "$APP_DIR"

if [[ -d .git ]]; then
  echo "=== Pulling latest ==="
  git pull --ff-only
else
  echo "=== $APP_DIR is not a git checkout — using the source already present ==="
  echo "    (push it from a workstation with deploy/push-deploy.sh)"
fi

echo "=== Building app images ==="
docker compose "${COMPOSE_ARGS[@]}" build next fastapi

echo "=== Starting / updating stack ==="
docker compose "${COMPOSE_ARGS[@]}" up -d --remove-orphans postgres fastapi next

echo "=== Waiting for FastAPI health check ==="
sleep 10
STATUS=$(docker compose "${COMPOSE_ARGS[@]}" exec -T fastapi \
  python3 -c "import urllib.request, json; print(json.loads(urllib.request.urlopen('http://localhost:8000/health').read())['status'])" \
  2>/dev/null || echo "error")
if [[ "$STATUS" == "ok" ]]; then
  echo "=== Deploy complete — FastAPI healthy ==="
else
  echo "=== ERROR: FastAPI health check failed after deploy ===" >&2
  docker compose "${COMPOSE_ARGS[@]}" logs fastapi --tail=20
  exit 1
fi

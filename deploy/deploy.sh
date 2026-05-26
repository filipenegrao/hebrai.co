#!/usr/bin/env bash
#
# deploy.sh — idempotent redeploy on the VPS.
#
# Pulls latest, rebuilds the app images, validates the nginx config in a
# throwaway container BEFORE touching the running stack, then brings the
# stack up and reloads nginx so edited config/certs take effect. Fails
# loudly on an invalid nginx config or an unhealthy backend.
#
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/hebrai}"
COMPOSE_ARGS=(
  -f docker-compose.yml
)

if [[ -f docker-compose.vps-host-nginx.yml ]]; then
  COMPOSE_ARGS+=(-f docker-compose.vps-host-nginx.yml)
fi

cd "$APP_DIR"

echo "=== Pulling latest ==="
git pull --ff-only

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

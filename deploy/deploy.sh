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
cd "$APP_DIR"

echo "=== Pulling latest ==="
git pull --ff-only

echo "=== Building app images ==="
docker compose build next fastapi

echo "=== Validating nginx config (nginx -t) before touching the running stack ==="
if ! docker compose run --rm --no-deps -T nginx nginx -t; then
  echo "ERROR: nginx config test failed — aborting deploy, running stack untouched." >&2
  exit 1
fi

echo "=== Starting / updating stack ==="
docker compose up -d --remove-orphans

echo "=== Reloading nginx (picks up edited nginx.conf and renewed certs) ==="
docker compose exec -T nginx nginx -s reload

echo "=== Waiting for FastAPI health check ==="
sleep 10
STATUS=$(docker compose exec -T fastapi \
  python3 -c "import urllib.request, json; print(json.loads(urllib.request.urlopen('http://localhost:8000/health').read())['status'])" \
  2>/dev/null || echo "error")
if [[ "$STATUS" == "ok" ]]; then
  echo "=== Deploy complete — FastAPI healthy ==="
else
  echo "=== ERROR: FastAPI health check failed after deploy ===" >&2
  docker compose logs fastapi --tail=20
  exit 1
fi

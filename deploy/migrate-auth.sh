#!/usr/bin/env bash
#
# migrate-auth.sh — run Better Auth migrations against the running Docker stack.
#
# Uses a temporary Node container on the compose internal network so the VPS
# does not need a host-level Node installation.
#
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/hebrai}"
COMPOSE_ARGS=(
  -f docker-compose.yml
)

if [[ -f "$APP_DIR/docker-compose.vps-host-nginx.yml" ]]; then
  COMPOSE_ARGS+=(-f docker-compose.vps-host-nginx.yml)
fi

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: $APP_DIR/.env not found." >&2
  exit 1
fi

set -a
. ./.env
set +a

NEXT_CID="$(docker compose "${COMPOSE_ARGS[@]}" ps -q next)"
if [[ -z "$NEXT_CID" ]]; then
  echo "ERROR: next container is not running. Start the stack before migrating auth." >&2
  exit 1
fi

INTERNAL_NETWORK="$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{println $k}}{{end}}' "$NEXT_CID" | grep '_internal$' | head -n1)"
if [[ -z "$INTERNAL_NETWORK" ]]; then
  echo "ERROR: could not determine compose internal network for next container." >&2
  exit 1
fi

docker run --rm \
  --network "$INTERNAL_NETWORK" \
  -v "$APP_DIR/frontend:/app" \
  -w /app \
  -e DATABASE_URL="$DATABASE_URL" \
  -e BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  -e BETTER_AUTH_URL="$BETTER_AUTH_URL" \
  -e NEXT_PUBLIC_BETTER_AUTH_URL="$NEXT_PUBLIC_BETTER_AUTH_URL" \
  node:24-alpine \
  sh -lc "npm ci && npx better-auth migrate"

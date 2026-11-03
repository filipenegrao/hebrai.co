#!/usr/bin/env bash
#
# push-deploy.sh — deploy from a workstation to a VPS whose app directory is
# not a git checkout.
#
# Rsyncs the source over SSH, then runs deploy/deploy.sh on the box. Pass a
# subdirectory to ship only part of the tree, which is the usual case:
#
#   bash deploy/push-deploy.sh backend      # backend-only change
#   bash deploy/push-deploy.sh frontend
#   bash deploy/push-deploy.sh              # whole tree
#
# This repository is public, so the target is not hardcoded. Put it in
# deploy/.deploy.env, which is gitignored:
#
#   VPS_HOST=vps-alias-or-ip
#   VPS_USER=deploy-user
#   VPS_PORT=22
#   APP_DIR=/srv/hebrai
#   SSH_KEY=~/.ssh/some_key        # optional; omit to use your ssh config
#
# Environment variables win over that file:
#   VPS_HOST=1.2.3.4 bash deploy/push-deploy.sh backend
#
# A dry run shows what would change without writing anything:
#   DRY_RUN=1 bash deploy/push-deploy.sh backend
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="${DEPLOY_ENV:-$REPO_ROOT/deploy/.deploy.env}"

# File values are defaults; anything already exported stays as it is.
if [[ -f "$CONFIG" ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
    [[ -n "${!key:-}" ]] || printf -v "$key" '%s' "${value%$'\r'}"
    export "${key?}"
  done < "$CONFIG"
fi

VPS_PORT="${VPS_PORT:-22}"
APP_DIR="${APP_DIR:-/srv/hebrai}"

for required in VPS_HOST VPS_USER; do
  if [[ -z "${!required:-}" ]]; then
    echo "ERROR: $required is not set. Put it in $CONFIG or pass it in the" >&2
    echo "       environment, e.g. VPS_HOST=… VPS_USER=… bash deploy/push-deploy.sh" >&2
    exit 1
  fi
done

SUBDIR="${1:-}"

SSH_CMD=(ssh -p "$VPS_PORT")
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_CMD+=(-i "${SSH_KEY/#\~/$HOME}")
fi

# Never --delete: the VPS app directory holds .env and other untracked state
# that is deliberately absent from the repo. The .env.example include has to
# come first, because rsync applies the first matching rule.
RSYNC_ARGS=(
  -ai
  --include '.env.example'
  --exclude '.env*'
  --exclude '.deploy.env'
  --exclude '.git'
  --exclude '__pycache__'
  --exclude '.pytest_cache'
  --exclude '.venv'
  --exclude 'node_modules'
  --exclude '.next'
  --exclude '.DS_Store'
)
if [[ -n "${DRY_RUN:-}" ]]; then
  RSYNC_ARGS+=(-n)
  echo "=== DRY RUN — nothing will be written ==="
fi

sync_dir() {
  local src="$1" dest="$2"
  echo "=== Syncing $src -> $VPS_USER@$VPS_HOST:$dest ==="
  rsync "${RSYNC_ARGS[@]}" -e "${SSH_CMD[*]}" "$src" "$VPS_USER@$VPS_HOST:$dest"
}

# deploy/ always goes first: a partial sync still has to run the current
# deploy.sh on the box, not whatever version happens to be there.
sync_dir "$REPO_ROOT/deploy/" "$APP_DIR/deploy/"

if [[ -n "$SUBDIR" ]]; then
  SUBDIR="${SUBDIR%/}"
  if [[ ! -d "$REPO_ROOT/$SUBDIR" ]]; then
    echo "ERROR: $SUBDIR is not a directory in $REPO_ROOT" >&2
    exit 1
  fi
  if [[ "$SUBDIR" != "deploy" ]]; then
    sync_dir "$REPO_ROOT/$SUBDIR/" "$APP_DIR/$SUBDIR/"
  fi
else
  sync_dir "$REPO_ROOT/" "$APP_DIR/"
fi

if [[ -n "${DRY_RUN:-}" ]]; then
  echo "=== DRY RUN complete — deploy.sh was not run ==="
  exit 0
fi

echo "=== Running deploy.sh on $VPS_HOST ==="
"${SSH_CMD[@]}" "$VPS_USER@$VPS_HOST" "cd '$APP_DIR' && APP_DIR='$APP_DIR' bash deploy/deploy.sh"

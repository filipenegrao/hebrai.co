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
# Override the target via the environment:
#   VPS_HOST=1.2.3.4 VPS_PORT=22 VPS_USER=ubuntu bash deploy/push-deploy.sh
#
# A dry run shows what would change without writing anything:
#   DRY_RUN=1 bash deploy/push-deploy.sh backend
#
set -euo pipefail

VPS_HOST="${VPS_HOST:-200.141.31.16}"
VPS_PORT="${VPS_PORT:-2222}"
VPS_USER="${VPS_USER:-filipe}"
APP_DIR="${APP_DIR:-/home/filipe/apps/hebrai}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_filipe_nopass}"

SUBDIR="${1:-}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SSH_CMD=(ssh -p "$VPS_PORT")
if [[ -f "$SSH_KEY" ]]; then
  SSH_CMD+=(-i "$SSH_KEY")
fi

# Never --delete: the VPS app directory holds .env and other untracked state
# that is deliberately absent from the repo.
RSYNC_ARGS=(
  -ai
  --exclude '.git'
  --exclude '.env'
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

SRC="$REPO_ROOT/"
DEST="$APP_DIR/"
if [[ -n "$SUBDIR" ]]; then
  SUBDIR="${SUBDIR%/}"
  if [[ ! -d "$REPO_ROOT/$SUBDIR" ]]; then
    echo "ERROR: $SUBDIR is not a directory in $REPO_ROOT" >&2
    exit 1
  fi
  SRC="$REPO_ROOT/$SUBDIR/"
  DEST="$APP_DIR/$SUBDIR/"
fi

echo "=== Syncing $SRC -> $VPS_USER@$VPS_HOST:$DEST ==="
rsync "${RSYNC_ARGS[@]}" -e "${SSH_CMD[*]}" "$SRC" "$VPS_USER@$VPS_HOST:$DEST"

if [[ -n "${DRY_RUN:-}" ]]; then
  echo "=== DRY RUN complete — deploy.sh was not run ==="
  exit 0
fi

echo "=== Running deploy.sh on $VPS_HOST ==="
"${SSH_CMD[@]}" "$VPS_USER@$VPS_HOST" "cd '$APP_DIR' && APP_DIR='$APP_DIR' bash deploy/deploy.sh"

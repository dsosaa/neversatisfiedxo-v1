#!/usr/bin/env bash

# Sync repo to Hostinger VPS, clean old artifacts, and reload the web container safely.
# - Keeps DB/Redis volumes intact (no docker volume prune)
# - Removes old/duplicate containers and build/image caches
# - Rebuilds and restarts the production stack

set -euo pipefail

HOST=${PRODUCTION_HOST:-82.180.137.156}
USER=${PRODUCTION_USER:-root}
REMOTE_PATH=${PRODUCTION_PATH:-/opt/neversatisfiedxo}
SSH_KEY=${SSH_KEY_PATH:-$HOME/.ssh/hostinger_deploy_ed25519}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.production.yml}

SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=no -o BatchMode=yes)

echo "🚚 Syncing repository to ${USER}@${HOST}:${REMOTE_PATH}..."
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude .next --exclude .env.local \
  -e "ssh ${SSH_OPTS[*]}" ./ "${USER}@${HOST}:${REMOTE_PATH}/"

echo "🧹 Cleaning and restarting containers on VPS..."
ssh "${SSH_OPTS[@]}" "${USER}@${HOST}" <<EOF
set -e
cd "$REMOTE_PATH"

echo "🛑 Bringing down any running stacks (dev and prod) and removing orphans..."
docker compose -f docker-compose.yml down --remove-orphans || true
docker compose -f "$COMPOSE_FILE" down --remove-orphans || true

echo "🧽 Removing stray containers matching v0_trailer_* ..."
CONTAINERS=\$(docker ps -aq --filter name=v0_trailer_)
if [ -n "\$CONTAINERS" ]; then
  docker rm -f \$CONTAINERS || true
fi

echo "🧼 Pruning old images and builder cache (keeping named volumes like DB/Redis)..."
docker image prune -af || true
docker builder prune -af || true

echo "🚀 Rebuilding and starting production stack cleanly..."
docker compose -f "$COMPOSE_FILE" up -d --build --force-recreate

echo "📋 Current container status:"
docker compose -f "$COMPOSE_FILE" ps

echo "🧽 Clearing Next.js cache in web container, then restarting web..."
docker compose -f "$COMPOSE_FILE" exec -T web sh -lc 'rm -rf .next/cache/* || true'
docker compose -f "$COMPOSE_FILE" restart web

echo "✅ Done."
EOF

echo "✅ Sync + clean + reload complete."

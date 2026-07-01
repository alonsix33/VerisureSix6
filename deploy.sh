#!/bin/bash
set -e

REMOTE="ubuntu@192.168.68.100"
REMOTE_PATH="/home/ubuntu/verisure-home-platform/dashboard/dist/"

echo "→ Building..."
cd "$(dirname "$0")/dashboard"
npm run build

echo "→ Deploying to Orange Pi..."
rsync -az --delete dist/ "$REMOTE:$REMOTE_PATH"

echo "→ Reloading nginx..."
ssh "$REMOTE" "sudo systemctl reload nginx"

echo ""
echo "✓ Deploy completo."
echo "  La PWA mostrará el prompt de actualización la próxima vez que se abra."

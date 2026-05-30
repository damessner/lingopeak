#!/usr/bin/env bash

# LingoPeak - Container Update Script
# Usage: cd /var/www/lingopeak && bash deployment/update.sh

set -e

INFO="[INFO]"
SUCCESS="[SUCCESS]"

cd "$(dirname "$0")/.."

echo "============================================="
echo "   LingoPeak Container Hot-Updater           "
echo "============================================="

# 1. Stash changes to prevent merge blocks
echo "$INFO Saving any temporary local changes..."
git stash || true

# 2. Pull main branch
echo "$INFO Pulling latest production release from GitHub..."
git fetch --all
git pull origin main

# 3. Align packages
echo "$INFO Verifying dependency updates..."
npm install --omit=dev

# 4. Rebuild production bundle
echo "$INFO Compiling Next.js assets..."
npm run build

# 5. Hot reload PM2
echo "$INFO Hot reloading Next.js daemon under PM2..."
pm2 reload lingopeak

echo "============================================="
echo "$SUCCESS LingoPeak update successfully complete!"
echo "============================================="

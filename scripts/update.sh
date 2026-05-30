#!/usr/bin/env bash

# LingoPeak - Standard Production Update Script
# Usage: bash /opt/lingopeak/scripts/update.sh

set -e

INFO="[INFO]"
SUCCESS="[SUCCESS]"

cd "$(dirname "$0")/.."

echo "============================================="
echo "   LingoPeak Production Updater              "
echo "============================================="

# 1. Stash any local modifications to prevent merge issues
echo "$INFO Saving any temporary local changes..."
git stash || true

# 2. Pull latest code from repository
echo "$INFO Fetching and pulling latest production branch..."
git fetch --all
git pull origin main

# 3. Clean install production packages
echo "$INFO Verifying and installing new dependencies..."
npm install --omit=dev

# 4. Compile new Next.js production build
echo "$INFO Rebuilding application assets..."
npm run build

# 5. Hot reload app under PM2 daemon
echo "$INFO Hot reloading Next.js server daemon under PM2..."
pm2 reload lingopeak

echo "============================================="
echo "$SUCCESS LingoPeak update successfully loaded! "
echo "============================================="

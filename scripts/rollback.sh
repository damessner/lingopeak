#!/usr/bin/env bash

# LingoPeak - Emergency Rollback Script
# Usage: bash /opt/lingopeak/scripts/rollback.sh [optional_commit_hash]

set -e

INFO="[INFO]"
SUCCESS="[SUCCESS]"
ERROR="[ERROR]"

cd "$(dirname "$0")/.."

echo "============================================="
echo "   LingoPeak System Rollback Engine          "
echo "============================================="

# 1. Determine rollback target (default is HEAD~1 / previous commit)
TARGET="HEAD~1"
if [ ! -z "$1" ]; then
  TARGET="$1"
fi

echo "$INFO Reverting codebase state to: $TARGET"

# Verify commit exists
if ! git rev-parse "$TARGET" &> /dev/null; then
  echo "$ERROR Commit hash or reference '$TARGET' was not found in git history!"
  exit 1
fi

# 2. Hard reset git
git reset --hard "$TARGET"

# 3. Clean install production packages matching state
echo "$INFO Re-aligning system package dependencies..."
npm install --omit=dev

# 4. Rebuild production build
echo "$INFO Re-compiling Next.js assets..."
npm run build

# 5. Reload PM2
echo "$INFO Hot reloading Next.js daemon under PM2..."
pm2 reload lingopeak

echo "============================================="
echo "$SUCCESS LingoPeak rollback successfully executed!"
echo "Currently at commit: $(git rev-parse --short HEAD)"
echo "============================================="

#!/usr/bin/env bash

# LingoPeak - Proxmox LXC Provisioning Script
# Designed for clean Debian 12 / Ubuntu 22.04 LTS containers.
# Run onliner: bash -c "$(curl -fsSL https://raw.githubusercontent.com/username/lingopeak/main/scripts/setup-lxc.sh)"

set -e

# Visual formatting
INFO="[INFO]"
SUCCESS="[SUCCESS]"
ERROR="[ERROR]"

echo "============================================="
echo "   LingoPeak Proxmox LXC Installer           "
echo "============================================="

# 1. Update system packages
echo "$INFO Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install basic dependencies
echo "$INFO Installing system dependencies (git, curl, zip, unzip, build-essential)..."
apt-get install -y git curl zip unzip build-essential python3-minimal

# 3. Install Node.js (Node 20 LTS)
if ! command -v node &> /dev/null; then
  echo "$INFO Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "$INFO Node.js is already installed: $(node -v)"
fi

# 4. Install PM2 process manager globally
if ! command -v pm2 &> /dev/null; then
  echo "$INFO Installing PM2 globally..."
  npm install -g pm2
else
  echo "$INFO PM2 is already installed: $(pm2 -v)"
fi

# 5. Clone repository
TARGET_DIR="/opt/lingopeak"
if [ ! -d "$TARGET_DIR" ]; then
  echo "$INFO Cloning LingoPeak repository into $TARGET_DIR..."
  # Prompt or assume public repo URL (replace with actual when public)
  git clone https://github.com/username/lingopeak.git "$TARGET_DIR"
else
  echo "$INFO Target directory $TARGET_DIR already exists, fetching latest changes..."
  cd "$TARGET_DIR"
  git fetch --all
  git reset --hard origin/main
fi

# Navigate to application
cd "$TARGET_DIR"

# 6. Setup environment variables file
if [ ! -f ".env" ]; then
  echo "$INFO Creating default .env configuration..."
  cat <<EOT > .env
PORT=3000
NODE_ENV=production
AI_PROVIDER=GEMINI
AI_API_KEY=""
# AI_ENDPOINT_URL=https://api.opencode.ai/v1/chat/completions
# AI_MODEL_NAME=zen-model
SESSION_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
EOT
  echo "$SUCCESS Created .env config. IMPORTANT: Edit $TARGET_DIR/.env to configure your AI keys!"
fi

# 7. Install Node modules
echo "$INFO Installing node dependencies..."
npm install --omit=dev

# 8. Build production assets
echo "$INFO Building Next.js production bundles..."
npm run build

# 9. Register application daemon under PM2
echo "$INFO Configuring process management under PM2 daemon..."
pm2 delete lingopeak &> /dev/null || true
pm2 start npm --name "lingopeak" -- start --port 3000
pm2 save

# 10. Enable PM2 startup on boot
echo "$INFO Registering PM2 service on system boot startup..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root || true

echo "============================================="
echo "$SUCCESS LingoPeak Installation Completed!  "
echo "---------------------------------------------"
echo "App is now running on: http://$(hostname -I | awk '{print $1}'):3000"
echo "To view app logs, run: pm2 logs lingopeak"
echo "To update the app, run: bash $TARGET_DIR/scripts/update.sh"
echo "============================================="

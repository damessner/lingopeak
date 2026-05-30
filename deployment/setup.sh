#!/usr/bin/env bash

# LingoPeak - Container Setup Script
# Runs inside the LXC container to install application dependencies.
# Usage: curl -fsSL https://raw.githubusercontent.com/damessner/lingopeak/master/deployment/setup.sh | bash

set -e

INFO="[INFO]"
SUCCESS="[SUCCESS]"

echo "============================================="
echo "   LingoPeak Container Environment Setup     "
echo "============================================="

# 1. Update container libraries
echo "$INFO Updating system dependencies..."
apt-get update && apt-get upgrade -y
apt-get install -y git curl zip unzip build-essential python3-minimal

# 2. Install Node.js 26 (Cutting Edge)
if ! command -v node &> /dev/null; then
  echo "$INFO Installing Node.js 26 (LTS Draft)..."
  curl -fsSL https://deb.nodesource.com/setup_26.x | bash -
  apt-get install -y nodejs
else
  echo "$INFO Node.js is already installed: $(node -v)"
fi

# 3. Install PM2 process manager
if ! command -v pm2 &> /dev/null; then
  echo "$INFO Installing PM2 globally..."
  npm install -g pm2
else
  echo "$INFO PM2 is already installed: $(pm2 -v)"
fi

# 4. Clone LingoPeak repository into /var/www/lingopeak
TARGET_DIR="/var/www/lingopeak"
mkdir -p /var/www

if [ ! -d "$TARGET_DIR" ]; then
  echo "$INFO Cloning LingoPeak repository into $TARGET_DIR..."
  git clone https://github.com/damessner/lingopeak.git "$TARGET_DIR"
else
  echo "$INFO Target directory $TARGET_DIR already exists, pulling updates..."
  cd "$TARGET_DIR"
  git fetch --all
  git reset --hard origin/master
fi

cd "$TARGET_DIR"

# 5. Build environment config
if [ ! -f ".env" ]; then
  echo "$INFO Initializing production .env file..."
  cat <<EOT > .env
PORT=3000
NODE_ENV=production
AI_PROVIDER=GEMINI
AI_API_KEY=""
# AI_ENDPOINT_URL=https://api.opencode.ai/v1/chat/completions
# AI_MODEL_NAME=zen-model
SESSION_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
EOT
  echo "$SUCCESS Created defaults config at $TARGET_DIR/.env. Please configure your AI API keys!"
fi

# 6. Install package requirements
echo "$INFO Installing npm dependency packages..."
npm install --omit=dev

# 7. Compile Next.js production build
echo "$INFO Recompiling Next.js assets..."
npm run build

# 8. Set up PM2 background process
echo "$INFO Initializing PM2 process configuration..."
pm2 delete lingopeak &> /dev/null || true
pm2 start npm --name "lingopeak" -- start --port 3000
pm2 save

# 9. Register PM2 service on system reboot/startup
echo "$INFO Configuring PM2 startup scripts on container boot..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root || true

echo "============================================="
echo "$SUCCESS LingoPeak environment set up successfully!"
echo "App is running at: http://$(hostname -I | awk '{print $1}'):3000"
echo "============================================="

# Write success marker for host script validation
echo "done" > /tmp/setup.done

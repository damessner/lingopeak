#!/usr/bin/env bash

# LingoPeak - Proxmox Host LXC Creator
# This script runs on the Proxmox VE host shell.
# It creates a Debian 12 container and launches the LingoPeak installer inside it.
# Usage: curl -fsSL https://raw.githubusercontent.com/damessner/lingopeak/master/deployment/create-lxc.sh | bash

set -e

# Colors for terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}    LingoPeak Proxmox LXC Provisioner        ${NC}"
echo -e "${GREEN}=============================================${NC}"

# 1. Check if running on Proxmox VE host
if [ ! -d "/etc/pve" ]; then
  echo -e "${RED}[ERROR] This script must run directly on the Proxmox VE Host shell!${NC}"
  exit 1
fi

# 2. Select Container ID
NEXT_CTID=$(pvesh get /cluster/nextid)
if [ -t 0 ]; then
  read -p "Enter Container ID [Default: $NEXT_CTID]: " CTID
elif [ -c /dev/tty ]; then
  read -p "Enter Container ID [Default: $NEXT_CTID]: " CTID < /dev/tty
else
  CTID=""
fi
CTID=${CTID:-$NEXT_CTID}

# Check if ID already exists
if pct status $CTID &>/dev/null; then
  echo -e "${RED}[ERROR] Container ID $CTID is already in use!${NC}"
  exit 1
fi

# 3. Select Storage
STORAGES=$(pvesm status -content rootdir | awk 'NR>1 {print $1}')
DEFAULT_STORAGE=$(echo "$STORAGES" | head -n 1)
if [ -t 0 ]; then
  read -p "Enter Storage Pool [Default: $DEFAULT_STORAGE]: " STORAGE
elif [ -c /dev/tty ]; then
  read -p "Enter Storage Pool [Default: $DEFAULT_STORAGE]: " STORAGE < /dev/tty
else
  STORAGE=""
fi
STORAGE=${STORAGE:-$DEFAULT_STORAGE}

# 4. OS Template provisioning
TEMPLATE_STORAGE="local"
TEMPLATE_DIR="/var/lib/vz/template/cache"

# Find local templates or local-lvm template location
if [ ! -d "$TEMPLATE_DIR" ]; then
  # Try to find templates storage path to locate templates directory
  TEMPLATE_STORAGE_PATH=$(pvesm path local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst 2>/dev/null || echo "")
  if [ -n "$TEMPLATE_STORAGE_PATH" ]; then
    TEMPLATE_DIR=$(dirname "$TEMPLATE_STORAGE_PATH")
  fi
fi

# Run pveam update to refresh template registries
echo -e "${YELLOW}[INFO] Updating Proxmox VE template database...${NC}"
pveam update || true

# Query the cluster registry dynamically for the newest available Debian 12 standard template filename
TEMPLATE_NAME=$(pveam available --section system | grep "debian-12-standard" | head -n 1 | awk '{print $2}' || echo "")

if [ -z "$TEMPLATE_NAME" ]; then
  # Fallback to a stable release if cluster registry query returned empty
  TEMPLATE_NAME="debian-12-standard_12.7-1_amd64.tar.zst"
fi

TEMPLATE_PATH="$TEMPLATE_DIR/$TEMPLATE_NAME"

if [ ! -f "$TEMPLATE_PATH" ]; then
  echo -e "${YELLOW}[INFO] Downloading template $TEMPLATE_NAME to local storage...${NC}"
  pveam download local $TEMPLATE_NAME
fi

# 5. Create container
echo -e "${YELLOW}[INFO] Creating LXC Container $CTID (Debian 12, 1 Core, 1GB RAM, 8GB Disk)...${NC}"
pct create $CTID local:vztmpl/$TEMPLATE_NAME \
  --ostype debian \
  --hostname lingopeak \
  --cores 1 \
  --memory 1024 \
  --swap 512 \
  --features nesting=1 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --storage $STORAGE \
  --rootfs $STORAGE:8 \
  --unprivileged 1 \
  --start 1

echo -e "${GREEN}[SUCCESS] Container $CTID created and started successfully!${NC}"
echo -e "${YELLOW}[INFO] Waiting 5 seconds for network allocation inside container...${NC}"
sleep 5

# 6. Execute installer script inside the container
echo -e "${YELLOW}[INFO] Launching LingoPeak application configuration inside container...${NC}"
pct exec $CTID -- bash -c "curl -fsSL https://raw.githubusercontent.com/damessner/lingopeak/master/deployment/setup.sh | bash"

# Get IP address of container
CT_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}[SUCCESS] LingoPeak is ready!${NC}"
echo -e "You can access the platform at: ${YELLOW}http://${CT_IP}:3000${NC}"
echo -e "To manage the container, use: pct enter $CTID"
echo -e "============================================="

#!/usr/bin/env bash

# LingoPeak - Proxmox Host LXC Creator
# This script runs on the Proxmox VE host shell.
# It creates a Debian LXC container and launches the LingoPeak installer inside it.
# Usage: curl -fsSL https://raw.githubusercontent.com/damessner/lingopeak/master/deployment/create-lxc.sh | bash

set -e
trap 'error_handler $LINENO "$BASH_COMMAND"' ERR

# Colors for terminal
YW=$(echo -e "\033[33m")
BL=$(echo -e "\033[36m")
RD=$(echo -e "\033[01;31m")
GN=$(echo -e "\033[1;92m")
CL=$(echo -e "\033[m")
BOLD=$(echo -e "\033[1m")

# UI Icons
CM="✔️"
CROSS="✖️"
INFO="💡"

function msg_info() {
  echo -e "${BL}[INFO]${CL} $1"
}

function msg_ok() {
  echo -e "${GN}[SUCCESS]${CL} $1"
}

function msg_error() {
  echo -e "${RD}[ERROR]${CL} $1"
}

function error_handler() {
  local exit_code="$?"
  local line_number="$1"
  local command="$2"
  echo -e "\n${RD}[ERROR]${CL} in line $line_number: exit code $exit_code: while executing command: $command\n"
}

function header_info {
  clear
  cat <<"EOF"
   __    _                      ____               __  
  / /   (_)___  ____ _____     / __ \___  ____ _  / /__
 / /   / / __ \/ __ `/ __ \   / /_/ / _ \/ __ `/ / //_/
/ /___/ / / / / /_/ / /_/ /  / ____/  __/ /_/ / / ,<   
/_____/_/_/ /_/\__, /\____/  /_/    \___/\__,_/_/_/|_|  
              /____/                                    
EOF
}

# 1. Pre-flight checks
function check_root() {
  if [ "$(id -u)" -ne 0 ]; then
    clear
    msg_error "Please run this script as root."
    exit 1
  fi
}

function pve_check() {
  if [ ! -d "/etc/pve" ]; then
    clear
    msg_error "This script must run directly on the Proxmox VE Host shell!"
    exit 1
  fi
}

function arch_check() {
  if [ "$(dpkg --print-architecture)" != "amd64" ]; then
    clear
    msg_error "This script only supports amd64 architecture!"
    exit 1
  fi
}

header_info
check_root
pve_check
arch_check

# 2. Get next ID
function get_valid_nextid() {
  local try_id
  try_id=$(pvesh get /cluster/nextid)
  while true; do
    if [ -f "/etc/pve/lxc/${try_id}.conf" ] || [ -f "/etc/pve/qemu-server/${try_id}.conf" ]; then
      try_id=$((try_id + 1))
      continue
    fi
    if lvs --noheadings -o lv_name 2>/dev/null | grep -qE "(^|[-_])${try_id}($|[-_])"; then
      try_id=$((try_id + 1))
      continue
    fi
    break
  done
  echo "$try_id"
}

# 3. Get Storages
function get_storages() {
  pvesm status -content rootdir | awk 'NR>1 {print $1}'
}

# whiptail prompts
if whiptail --backtitle "Proxmox VE Helper Scripts" --title "LingoPeak LXC Installer" --yesno "This will create a new LingoPeak LXC Container. Proceed?" 10 58; then
  :
else
  header_info
  echo -e "${RD}${CROSS} User exited script${CL}\n"
  exit 0
fi

if SETTINGS_MODE=$(whiptail --backtitle "Proxmox VE Helper Scripts" --title "Configuration Mode" --menu "Select a configuration mode:" 12 58 2 \
  "Default" "Use standard settings (Debian 13, 1 Core, 1GB RAM, 8GB Disk, DHCP)" \
  "Advanced" "Customize resources, OS version, and network settings" 3>&1 1>&2 2>&3); then
  :
else
  header_info
  echo -e "${RD}${CROSS} User exited script${CL}\n"
  exit 0
fi

if [ "$SETTINGS_MODE" == "Default" ]; then
  CTID=$(get_valid_nextid)
  STORAGES=$(get_storages)
  STORAGE=$(echo "$STORAGES" | head -n 1)
  RAM="1024"
  CORES="1"
  DISK="8"
  BRIDGE="vmbr0"
  OS_VER="13" # Debian 13 Trixie
else
  # Advanced Mode
  
  # 1. CTID
  DEFAULT_ID=$(get_valid_nextid)
  if CTID=$(whiptail --backtitle "Proxmox VE Helper Scripts" --title "Container ID" --inputbox "Enter Container ID:" 10 58 "$DEFAULT_ID" 3>&1 1>&2 2>&3); then
    :
  else
    header_info && echo -e "${RD}${CROSS} User exited script${CL}\n" && exit 0
  fi
  
  if pct status $CTID &>/dev/null; then
    whiptail --title "Error" --msgbox "Container ID $CTID is already in use!" 10 58
    exit 1
  fi
  
  # 2. Storage
  STORAGES=$(get_storages)
  STORAGE_ARGS=()
  for s in $STORAGES; do
    STORAGE_ARGS+=("$s" "Storage Pool")
  done
  if STORAGE=$(whiptail --backtitle "Proxmox VE Helper Scripts" --title "Storage Pool" --menu "Select storage pool for rootfs:" 15 58 6 "${STORAGE_ARGS[@]}" 3>&1 1>&2 2>&3); then
    :
  else
    header_info && echo -e "${RD}${CROSS} User exited script${CL}\n" && exit 0
  fi
  
  # 3. OS Version
  if OS_VER=$(whiptail --backtitle "Proxmox VE Helper Scripts" --title "OS Version" --menu "Select Debian version as basis:" 12 58 2 \
    "13" "Debian 13 (Trixie - Recommended)" \
    "12" "Debian 12 (Bookworm)" 3>&1 1>&2 2>&3); then
    :
  else
    header_info && echo -e "${RD}${CROSS} User exited script${CL}\n" && exit 0
  fi
  
  # 4. CPU Cores
  if CORES=$(whiptail --backtitle "Proxmox VE Helper Scripts" --title "CPU Cores" --inputbox "Enter CPU cores allocation:" 10 58 "1" 3>&1 1>&2 2>&3); then
    :
  else
    header_info && echo -e "${RD}${CROSS} User exited script${CL}\n" && exit 0
  fi
  
  # 5. RAM
  if RAM=$(whiptail --backtitle "Proxmox VE Helper Scripts" --title "RAM (MB)" --inputbox "Enter RAM size in MB:" 10 58 "1024" 3>&1 1>&2 2>&3); then
    :
  else
    header_info && echo -e "${RD}${CROSS} User exited script${CL}\n" && exit 0
  fi
  
  # 6. Disk Size
  if DISK=$(whiptail --backtitle "Proxmox VE Helper Scripts" --title "Disk Size (GB)" --inputbox "Enter Disk Size in GB:" 10 58 "8" 3>&1 1>&2 2>&3); then
    :
  else
    header_info && echo -e "${RD}${CROSS} User exited script${CL}\n" && exit 0
  fi
  
  # 7. Bridge
  if BRIDGE=$(whiptail --backtitle "Proxmox VE Helper Scripts" --title "Network Bridge" --inputbox "Enter network bridge interface:" 10 58 "vmbr0" 3>&1 1>&2 2>&3); then
    :
  else
    header_info && echo -e "${RD}${CROSS} User exited script${CL}\n" && exit 0
  fi
fi

# Confirm settings
SUMMARY_TEXT="LingoPeak Container Details:

  Container ID:     $CTID
  Storage Pool:     $STORAGE
  CPU Cores:        $CORES
  RAM Allocation:   $RAM MB
  Disk Space:       $DISK GB
  OS Base:          Debian $OS_VER
  Bridge Interface: $BRIDGE
  IP Assignment:    DHCP (IPv4)

Proceed with provisioning this LXC Container?"

if whiptail --backtitle "Proxmox VE Helper Scripts" --title "Confirm Provisioning" --yesno "$SUMMARY_TEXT" 16 60; then
  :
else
  header_info
  echo -e "${RD}${CROSS} User exited script${CL}\n"
  exit 0
fi

header_info
echo -e "\n Loading..."

# 4. OS Template provisioning
TEMPLATE_STORAGE="local"
TEMPLATE_DIR="/var/lib/vz/template/cache"

# Find local templates or local-lvm template location dynamically
TEMPLATE_STORAGE_PATH=$(pvesm path local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst 2>/dev/null || echo "")
if [ -n "$TEMPLATE_STORAGE_PATH" ]; then
  TEMPLATE_DIR=$(dirname "$TEMPLATE_STORAGE_PATH")
fi

# Run pveam update to refresh template registries
msg_info "Updating Proxmox VE template database..."
pveam update || true

# Query the cluster registry dynamically for the newest available Debian standard template filename matching chosen version
OS_PATTERN="debian-${OS_VER}-standard"
TEMPLATE_NAME=$(pveam available --section system | grep "$OS_PATTERN" | head -n 1 | awk '{print $2}' || echo "")

if [ -z "$TEMPLATE_NAME" ]; then
  # Fallback if cluster registry query returned empty
  if [ "$OS_VER" == "13" ]; then
    TEMPLATE_NAME="debian-13-standard_13.0-1_amd64.tar.zst"
  else
    TEMPLATE_NAME="debian-12-standard_12.7-1_amd64.tar.zst"
  fi
fi

TEMPLATE_PATH="$TEMPLATE_DIR/$TEMPLATE_NAME"

if [ ! -f "$TEMPLATE_PATH" ]; then
  msg_info "Downloading template $TEMPLATE_NAME to local storage..."
  pveam download local $TEMPLATE_NAME
fi

# 5. Create container
msg_info "Creating LXC Container $CTID (Debian $OS_VER)..."
pct create $CTID local:vztmpl/$TEMPLATE_NAME \
  --ostype debian \
  --hostname lingopeak \
  --cores $CORES \
  --memory $RAM \
  --swap 512 \
  --features nesting=1 \
  --net0 name=eth0,bridge=$BRIDGE,ip=dhcp \
  --storage $STORAGE \
  --rootfs $STORAGE:$DISK \
  --unprivileged 1 \
  --start 1

msg_ok "Container $CTID created and started successfully!"
msg_info "Waiting 5 seconds for network allocation inside container..."
sleep 5

# 6. Execute installer script inside the container
msg_info "Launching LingoPeak setup script inside container..."
pct exec $CTID -- bash -c "curl -fsSL https://raw.githubusercontent.com/damessner/lingopeak/master/deployment/setup.sh | bash"

# Get IP address of container
CT_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')

header_info
echo -e "${GN}=============================================${CL}"
echo -e "${GN}[SUCCESS] LingoPeak is ready!${CL}"
echo -e "Access the platform at: ${YW}http://${CT_IP}:3000${CL}"
echo -e "To manage the container, use: ${BOLD}pct enter $CTID${CL}"
echo -e "${GN}=============================================${CL}"

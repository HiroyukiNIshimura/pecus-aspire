#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/.." && pwd -P)

[ "$(id -u)" -eq 0 ] || {
  echo "[Error] Run with root privileges: sudo $0" >&2
  exit 1
}
[ -f "$SCRIPT_DIR/.env" ] || {
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  echo "[Info] Created $SCRIPT_DIR/.env. Edit BUILD_PC_IP and rerun setup.sh." >&2
  exit 1
}

# shellcheck disable=SC1091
. "$SCRIPT_DIR/.env"
COATI_USER=${COATI_USER:-coati}
DATA_PATH=${DATA_PATH:-/var/docker/coati/data}
REGISTRY="${BUILD_PC_IP:?BUILD_PC_IP is required}:${REGISTRY_PORT:-5000}"

command -v docker >/dev/null 2>&1 || {
  echo "[Error] Docker is required before running setup.sh" >&2
  exit 1
}
command -v jq >/dev/null 2>&1 || {
  echo "[Error] jq is required before running setup.sh" >&2
  exit 1
}
command -v ssh >/dev/null 2>&1 || {
  echo "[Error] ssh is required before running setup.sh" >&2
  exit 1
}

if ! id "$COATI_USER" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "$COATI_USER"
fi
usermod -aG docker "$COATI_USER" 2>/dev/null || true
uid=$(id -u "$COATI_USER")
gid=$(id -g "$COATI_USER")

for entry in CONTAINER_UID:$uid CONTAINER_GID:$gid; do
  name=${entry%%:*}
  value=${entry#*:}
  if grep -q "^$name=" "$SCRIPT_DIR/.env"; then
    sed -i "s/^$name=.*/$name=$value/" "$SCRIPT_DIR/.env"
  else
    printf '%s=%s\n' "$name" "$value" >>"$SCRIPT_DIR/.env"
  fi
done

mkdir -p \
  "$DATA_PATH/postgres" \
  "$DATA_PATH/redis" \
  "$DATA_PATH/redis-frontend" \
  "$DATA_PATH/uploads" \
  "$DATA_PATH/notifications" \
  "$DATA_PATH/logs/webapi-blue" \
  "$DATA_PATH/logs/webapi-green" \
  "$DATA_PATH/logs/backfire-blue" \
  "$DATA_PATH/logs/backfire-green" \
  "$DATA_PATH/logs/dbmanager" \
  "$DATA_PATH/backups/postgres" \
  "$DATA_PATH/prometheus" \
  "$DATA_PATH/releases"
chown -R "$uid:$gid" \
  "$DATA_PATH/redis" \
  "$DATA_PATH/redis-frontend" \
  "$DATA_PATH/uploads" \
  "$DATA_PATH/notifications" \
  "$DATA_PATH/logs" \
  "$DATA_PATH/backups" \
  "$DATA_PATH/prometheus" \
  "$DATA_PATH/releases"

daemon_json=/etc/docker/daemon.json
mkdir -p /etc/docker
if [ -f "$daemon_json" ]; then
  cp "$daemon_json" "$daemon_json.backup.$(date +%Y%m%d%H%M%S)"
  jq --arg registry "$REGISTRY" \
    '."insecure-registries" = (((."insecure-registries" // []) + [$registry]) | unique)' \
    "$daemon_json" >"$daemon_json.tmp"
else
  jq -n --arg registry "$REGISTRY" '{"insecure-registries":[$registry]}' >"$daemon_json.tmp"
fi
mv "$daemon_json.tmp" "$daemon_json"

if command -v systemctl >/dev/null 2>&1; then
  systemctl restart docker
elif command -v service >/dev/null 2>&1; then
  service docker restart
else
  echo "[Warn] Restart Docker manually before the first deployment." >&2
fi

chown -R "$uid:$gid" "$DEPLOY_DIR"
echo "[OK] Host setup completed for $COATI_USER"
echo "[Next] Run as $COATI_USER: $DEPLOY_DIR/deploy-pc/deploy.sh <release>"

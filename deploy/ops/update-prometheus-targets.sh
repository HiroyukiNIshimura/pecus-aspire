#!/bin/sh
set -eu

# Usage: ./update-prometheus-targets.sh [slot]

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

targets_dir="$script_dir/prometheus/targets"
mkdir -p "$targets_dir"

if [ -n "${1:-}" ]; then
  slot="$1"
else
  slot="$(active_slot)"
fi

echo "[Info] Updating Prometheus targets for slot: $slot"

cat > "$targets_dir/backend.json" <<EOF
[
  {
    "targets": ["pecusapi-${slot}:7265"],
    "labels": {
      "slot": "${slot}",
      "env": "production",
      "service": "backend"
    }
  }
]
EOF

cat > "$targets_dir/backfire.json" <<EOF
[
  {
    "targets": ["backfire-${slot}:8080"],
    "labels": {
      "slot": "${slot}",
      "env": "production",
      "service": "backfire"
    }
  }
]
EOF

# Frontend doesn't expose metrics yet, but placeholder if needed
# (Skipped for now)

echo "[OK] Updated targets in $targets_dir"
#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/../.." && pwd -P)
slot=${1:-}
case "$slot" in blue|green) ;; *) exit 2 ;; esac
targets="$DEPLOY_DIR/ops/prometheus/targets"
mkdir -p "$targets"

cat >"$targets/backend.json" <<EOF
[{"targets":["pecusapi-$slot:7265"],"labels":{"slot":"$slot","env":"production","service":"backend"}}]
EOF
cat >"$targets/backfire.json" <<EOF
[{"targets":["backfire-$slot:8080"],"labels":{"slot":"$slot","env":"production","service":"backfire"}}]
EOF
cat >"$targets/frontend.json" <<EOF
[{"targets":["frontend-$slot:3000"],"labels":{"slot":"$slot","env":"production","service":"frontend"}}]
EOF

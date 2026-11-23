#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/.." && pwd -P)
FAKE_DIR=$(mktemp -d)
trap 'rm -rf "$FAKE_DIR"' EXIT

echo "[Test] ShellCheck"
# File names in deploy currently contain no whitespace.
# shellcheck disable=SC2046
shellcheck -x $(find "$DEPLOY_DIR" -type f \( -name '*.sh' -o -name coati \) -print | sort)

echo "[Test] POSIX shell syntax"
find "$DEPLOY_DIR" -type f \( -name '*.sh' -o -name coati \) -print0 |
  xargs -0 dash -n

echo "[Test] Smoke status parser"
cat >"$FAKE_DIR/docker" <<'EOF'
#!/bin/sh
case "$*" in
  *"pecusapi-blue:7265/health"*) printf '  HTTP/1.1 200 OK\r\n' >&2 ;;
  *"frontend-blue:3000/"*) printf '  HTTP/1.1 307 Temporary Redirect\r\n' >&2 ;;
  *) exit 1 ;;
esac
EOF
chmod +x "$FAKE_DIR/docker"
PATH="$FAKE_DIR:$PATH" "$DEPLOY_DIR/ops/internal/smoke-test-slot.sh" blue

echo "[Test] Health starts waiting and fails immediately when unhealthy"
mkdir -p "$FAKE_DIR/state"
cat >"$FAKE_DIR/docker" <<'EOF'
#!/bin/sh
count_file="$FAKE_STATE_DIR/count"
count=0
[ ! -f "$count_file" ] || count=$(cat "$count_file")
count=$((count + 1))
echo "$count" >"$count_file"
case "$*" in
  "inspect -f {{.State.Running}} test-container") echo true ;;
  "inspect -f {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} test-container")
    [ "$count" -le 3 ] && echo starting || echo unhealthy
    ;;
  *) exit 0 ;;
esac
EOF
chmod +x "$FAKE_DIR/docker"
# Shell variables inside the child script are intentionally expanded by dash.
# shellcheck disable=SC2016
if env FAKE_STATE_DIR="$FAKE_DIR/state" PATH="$FAKE_DIR:$PATH" dash -c '
  DEPLOY_DIR=$1
  . "$DEPLOY_DIR/lib/common.sh"
  if wait_health test-container 20 >/dev/null 2>&1; then
    exit 1
  fi
' sh "$DEPLOY_DIR"; then
  die "Unhealthy container was accepted" 2>/dev/null || exit 1
fi

echo "[Test] Deployment lock contention"
lock="$FAKE_DIR/deploy.lock"
mkdir "$lock"
printf '%s\n' 999999 >"$lock/pid"
# Shell variables inside the child script are intentionally expanded by dash.
# shellcheck disable=SC2016
if env DATA_PATH="$FAKE_DIR" DEPLOY_LOCK_TIMEOUT=2 dash -c '
  DEPLOY_DIR=$1
  . "$DEPLOY_DIR/lib/common.sh"
  start=$(date +%s)
  if acquire_deploy_lock "$2"; then
    exit 1
  fi
  [ $(( $(date +%s) - start )) -ge 2 ]
' sh "$DEPLOY_DIR" "$lock"; then
  echo "[Error] Deployment lock contention unexpectedly succeeded" >&2
  exit 1
fi

echo "[OK] Deployment script checks passed."

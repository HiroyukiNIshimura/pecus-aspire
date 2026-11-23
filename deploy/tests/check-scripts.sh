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

echo "[Test] Public smoke uses IPv4 loopback and reports wget errors"
cat >"$FAKE_DIR/docker" <<'EOF'
#!/bin/sh
case "$*" in
  # Nginx listens on IPv4 only; localhost resolves to ::1 in the Alpine image.
  *"http://localhost/"*) echo "wget: can't connect to remote host: Connection refused" >&2; exit 1 ;;
  *"http://127.0.0.1/"*) printf '  HTTP/1.1 307 Temporary Redirect\r\n' >&2 ;;
  *"00-active-slot.conf"*) echo blue ;;
  *) exit 1 ;;
esac
EOF
chmod +x "$FAKE_DIR/docker"
PATH="$FAKE_DIR:$PATH" "$DEPLOY_DIR/ops/internal/smoke-test-public.sh" blue
cat >"$FAKE_DIR/docker" <<'EOF'
#!/bin/sh
echo "wget: can't connect to remote host: Connection refused" >&2
exit 1
EOF
if public_err=$(PATH="$FAKE_DIR:$PATH" "$DEPLOY_DIR/ops/internal/smoke-test-public.sh" blue 2>&1); then
  echo "[Error] Public smoke test unexpectedly passed" >&2
  exit 1
fi
case "$public_err" in
  *"Connection refused"*"no HTTP response"*) ;;
  *) echo "[Error] Public smoke test hid the wget error: $public_err" >&2; exit 1 ;;
esac

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

if command -v flock >/dev/null 2>&1; then
  lock="$FAKE_DIR/deploy.lock"
  # Shell variables inside the child scripts are intentionally expanded by dash.
  # shellcheck disable=SC2016
  try_lock='
    DEPLOY_DIR=$1
    . "$DEPLOY_DIR/lib/common.sh"
    acquire_deploy_lock "$2"
  '

  echo "[Test] Deployment lock acquires and is reusable after exit"
  DEPLOY_LOCK_TIMEOUT=1 dash -c "$try_lock" sh "$DEPLOY_DIR" "$lock" >/dev/null
  DEPLOY_LOCK_TIMEOUT=1 dash -c "$try_lock" sh "$DEPLOY_DIR" "$lock" >/dev/null

  echo "[Test] Deployment lock contention times out"
  # Keep the lock in a single process (exec) so killing it really drops it.
  # shellcheck disable=SC2016
  dash -c 'exec 9<"$1"; flock 9; exec sleep 30' sh "$lock" &
  holder=$!
  sleep 1
  start=$(date +%s)
  if DEPLOY_LOCK_TIMEOUT=2 dash -c "$try_lock" sh "$DEPLOY_DIR" "$lock" >/dev/null 2>&1; then
    kill "$holder" 2>/dev/null || true
    echo "[Error] Deployment lock contention unexpectedly succeeded" >&2
    exit 1
  fi
  [ $(( $(date +%s) - start )) -ge 2 ] || {
    kill "$holder" 2>/dev/null || true
    echo "[Error] Deployment lock did not wait for its timeout" >&2
    exit 1
  }

  echo "[Test] Deployment lock is released when the holder is killed"
  kill -9 "$holder"
  wait "$holder" 2>/dev/null || true
  DEPLOY_LOCK_TIMEOUT=1 dash -c "$try_lock" sh "$DEPLOY_DIR" "$lock" >/dev/null

  if [ "$(id -u)" -ne 0 ]; then
    echo "[Test] Unwritable lock directory fails fast"
    mkdir "$FAKE_DIR/readonly"
    chmod 555 "$FAKE_DIR/readonly"
    start=$(date +%s)
    if DEPLOY_LOCK_TIMEOUT=30 dash -c "$try_lock" sh "$DEPLOY_DIR" "$FAKE_DIR/readonly/deploy.lock" >/dev/null 2>&1; then
      echo "[Error] Lock in an unwritable directory unexpectedly succeeded" >&2
      exit 1
    fi
    [ $(( $(date +%s) - start )) -lt 5 ] || {
      echo "[Error] Unwritable lock directory did not fail fast" >&2
      exit 1
    }
    chmod 755 "$FAKE_DIR/readonly"
  fi
else
  echo "[Skip] Deployment lock tests: flock not found (install util-linux)"
fi

echo "[OK] Deployment script checks passed."

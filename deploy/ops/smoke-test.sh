#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
root_dir=$(CDPATH= cd -- "$script_dir/.." && pwd -P)

# nginx コンテナ内から内部DNSで到達性を確認
# - フロント: / (200 期待) はNextの都合で 3xx になることもあるので 200/3xx を許容
# - API: /health は 200 必須

check_http_code() {
  url="$1"
  name="$2"
  # exec -T avoids TTY issues.
  # Using wget in sh (alpine) or curl if available. Alpine Nginx usually has wget.
  # wget -q -S -O /dev/null prints headers to stderr.
  # awk parses the HTTP status line.
  
  # Note: complex piping inside docker exec needs escaping or shell wrapping
  cmd="wget -q -S -O /dev/null '$url' 2>&1 | grep 'HTTP/' | tail -n 1 | awk '{print \$2}'"
  
  # Run command inside nginx container
  code=$(docker compose -f "$root_dir/docker-compose.infra.yml" exec -T nginx sh -c "$cmd" || echo "")
  
  # Trim newlines
  code=$(echo "$code" | tr -d '\r\n')

  if [ -z "$code" ]; then
    echo "[NG] $name: no http status from $url (Connection failed?)" >&2
    return 1
  fi
  
  echo "[OK] $name: $url => $code"
  echo "$code"
}

check_api() {
  slot="$1"
  code=$(check_http_code "http://pecusapi-$slot:7265/health" "api-$slot")
  if [ "$code" != "200" ]; then
     echo "[Fail] API health check failed for $slot (Expected 200, got $code)" >&2
     return 1
  fi
}

check_front() {
  slot="$1"
  # 200/301/302 allowed
  code=$(check_http_code "http://frontend-$slot:3000/" "front-$slot")
  case "$code" in
    200|301|302|307|308) 
      return 0 
      ;;
    *)
      echo "[Fail] Frontend check failed for $slot (Got $code)" >&2
      return 1
      ;;
  esac
}

# Main

if [ -n "${1:-}" ]; then
  slots="$1"
else
  slots="blue green"
fi

for s in $slots; do
  echo "Checking $s..."
  # Check if containers running first
  if [ "$(docker inspect -f '{{.State.Running}}' "pecus-webapi-$s" 2>/dev/null)" = "true" ]; then
    check_api "$s"
  else
    echo "[Skip] api-$s not running"
  fi
  
  if [ "$(docker inspect -f '{{.State.Running}}' "pecus-frontend-$s" 2>/dev/null)" = "true" ]; then
    check_front "$s"
  else
    echo "[Skip] frontend-$s not running"
  fi
done
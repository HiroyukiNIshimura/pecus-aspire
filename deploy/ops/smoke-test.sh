#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"

# nginx コンテナ内から内部DNSで到達性を確認
# - フロント: / (200 期待) はNextの都合で 3xx になることもあるので 200/3xx を許容
# - API: /health は 200 必須

check_http_code() {
  local url="$1"
  local name="$2"
  local codes
  codes=$(docker compose -f "$root_dir/docker-compose.infra.yml" exec -T nginx sh -lc "wget -q -S -O /dev/null '$url' 2>&1 | awk '/^  HTTP\//{print \$2; exit}'")
  if [[ -z "$codes" ]]; then
    echo "[ng] $name: no http status from $url" >&2
    return 1
  fi
  echo "[ok] $name: $url => $codes"
}

check_api() {
  local slot="$1"
  check_http_code "http://pecusapi-$slot:7265/health" "api-$slot"
}

check_front() {
  local slot="$1"
  # 200/301/302 を許容
  local url="http://frontend-$slot:3000/"
  local code
  code=$(docker compose -f "$root_dir/docker-compose.infra.yml" exec -T nginx sh -lc "wget -q -S -O /dev/null '$url' 2>&1 | awk '/^  HTTP\//{print \$2; exit}'")
  case "$code" in
    200|301|302)
      echo "[ok] front-$slot: $url => $code" ;;
    *)
      echo "[ng] front-$slot: $url => $code" >&2
      return 1 ;;
  esac
}

check_api blue
check_front blue
check_api green
check_front green

echo "[ok] smoke test finished"

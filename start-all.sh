#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for dir in api web admin; do
  if [[ ! -d "$ROOT_DIR/$dir" ]]; then
    echo "Missing required directory: $dir"
    exit 1
  fi
done

declare -a pids=()

start_service() {
  local name="$1"
  local dir="$2"

  (
    cd "$ROOT_DIR/$dir"
    echo "[$name] starting in $dir..."
    npm run dev
  ) &

  pids+=("$!")
}

cleanup() {
  echo
  echo "Stopping all services..."

  for pid in "${pids[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  wait || true
  echo "All services stopped."
}

trap cleanup INT TERM EXIT

start_service "api" "api"
start_service "web" "web"
start_service "admin" "admin"

echo "Started api, web, and admin. Press Ctrl+C to stop all."
wait

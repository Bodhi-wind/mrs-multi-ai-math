#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "▶ MRS setup check…"
if [[ ! -d "$ROOT/backend/node_modules" ]]; then
  echo "  installing backend deps…"
  (cd "$ROOT/backend" && npm install)
fi
if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
  echo "  installing frontend deps…"
  (cd "$ROOT/frontend" && npm install)
fi

echo "▶ Seeding DB…"
(cd "$ROOT/backend" && npm run seed)

echo "▶ API :8787"
(cd "$ROOT/backend" && npm run dev) &
API_PID=$!

echo "▶ Web :5173"
(cd "$ROOT/frontend" && npm run dev -- --host 0.0.0.0 --port 5173) &
FE_PID=$!

cleanup() {
  kill "$API_PID" "$FE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "  Workbench  http://localhost:5173"
echo "  API        http://localhost:8787/api/health"
echo "  Arena      https://arena.ai/agent/"
echo ""
wait

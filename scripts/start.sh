#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "▶ Seeding DB (idempotent)…"
cd "$ROOT/backend"
npm run seed

echo "▶ Starting API on :8787…"
npm run dev &
API_PID=$!

echo "▶ Starting frontend on :5173…"
cd "$ROOT/frontend"
npm run dev &
FE_PID=$!

trap 'kill $API_PID $FE_PID 2>/dev/null || true' EXIT
wait

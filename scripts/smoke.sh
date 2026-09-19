#!/usr/bin/env bash
# Smoke test against a running API (default localhost:8787)
set -euo pipefail
API="${MRS_API:-http://127.0.0.1:8787}"

echo "Smoke → $API"
curl -sf "$API/api/health" | grep -q '"ok":true'
curl -sf "$API/api/arena/manifest" | grep -q 'MRS'
curl -sf "$API/api/problems/unit-disk-100-circle-covering" | grep -q 'unit-disk'
curl -sf -X POST "$API/api/tools/covering-bound" \
  -H 'Content-Type: application/json' \
  -d '{"n":7,"mode":"rings","grid":21}' | grep -q 'numerical_upper_bound'
curl -sf -X POST "$API/api/pipeline/run" \
  -H 'Content-Type: application/json' \
  -d '{"slug":"unit-disk-100-circle-covering","roles":["explorer","synthesizer"],"use_llm":false,"write_knowledge":true}' \
  | grep -q 'synthesis_id'
# compliance deny
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/api/prompts/build" \
  -H 'Content-Type: application/json' \
  -d '{"slug":"collatz","role":"explorer","focus":"hack into server with malware"}')
test "$code" = "403"
echo "OK all smoke checks passed"

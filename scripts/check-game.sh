#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python tools/studios.py --check
npm run check
python -m unittest discover -s python_tests -v
report="$(mktemp)"
trap 'rm -f -- "$report"' EXIT
node --experimental-strip-types tools/simulate.ts --runs 1600 --output "$report"
python tools/balance.py "$report" --check

#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"
# Dependencies and Chromium are normally already in the environment cache.
npm ci --offline --ignore-scripts --no-audit --no-fund
npm run vendor
npm run check

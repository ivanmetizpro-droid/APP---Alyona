#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"
node -e 'const major = Number(process.versions.node.split(".")[0]); if (major < 22 || major >= 25) { console.error("Required Node.js 22–24; recommended version in .nvmrc"); process.exit(1); }'
npm ci --ignore-scripts --no-fund
npm run vendor
npm run check
if [[ -n "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-}" ]]; then
  [[ -x "$PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH" ]] || { printf '%s\n' 'Configured Chromium executable is unavailable' >&2; exit 1; }
elif [[ "${ELEKTROSMETA_INSTALL_SYSTEM_DEPS:-0}" == "1" ]]; then
  npx --no-install playwright install --with-deps chromium
else
  npx --no-install playwright install chromium
fi
npm run test:e2e

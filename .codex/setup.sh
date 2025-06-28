#!/usr/bin/env bash
set -euo pipefail
npm ci --offline
npm run build && npm test

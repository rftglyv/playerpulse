#!/usr/bin/env bash
# Renders PlayerPulse OG images (1200x630) from og.html via headless Chrome.
# Usage: scripts/brand/og/render.sh   (needs network for Google Fonts)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../../.." && pwd)"
OUT="$ROOT/apps/web/public/og"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p "$OUT"
for v in home dashboard auth; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --window-size=1200,630 --virtual-time-budget=6000 \
    --screenshot="$OUT/og-$v.png" "file://$DIR/og.html#$v" >/dev/null 2>&1
  echo "$OUT/og-$v.png $(wc -c <"$OUT/og-$v.png") bytes"
done

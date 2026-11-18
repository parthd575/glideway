#!/usr/bin/env bash
# Build the road-data tiles GlideWay uses to score routes (signals, lighting, surface, speed limits).
# Usage: scripts/build-osm-data.sh path/to/region.osm.pbf   (requires osmium-tool)
set -euo pipefail
IN="${1:?usage: $0 region.osm.pbf}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
osmium tags-filter "$IN" w/highway n/highway=traffic_signals -o "$TMP/filtered.osm.pbf" --overwrite
osmium export "$TMP/filtered.osm.pbf" -f geojsonseq --geometry-types=point,linestring | node scripts/build-osm-tiles.mjs data/osm-tiles
node scripts/sync-osm-assets.mjs

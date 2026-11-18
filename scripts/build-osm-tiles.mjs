// Usage: osmium export filtered.osm.pbf -f geojsonseq --geometry-types=point,linestring | node scripts/build-osm-tiles.mjs [outDir]
// Splits signals + road ways into TILE-degree JSON tiles read by src/lib/localOsm.ts.
import { createInterface } from "node:readline";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const TILE = 0.1; // keep in sync with src/lib/localOsm.ts
const out = process.argv[2] ?? "data/osm-tiles";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const KEEP = ["highway", "lit", "surface", "smoothness", "bridge", "layer", "maxspeed"];
const tiles = new Map();
const tile = (k) => { let t = tiles.get(k); if (!t) tiles.set(k, (t = { s: [], w: [] })); return t; };
const key = (x, y) => `${Math.floor(x / TILE)}_${Math.floor(y / TILE)}`;
const r6 = (n) => Math.round(n * 1e5) / 1e5; // ~1 m, plenty for 25 m matching
let ns = 0, nw = 0;

for await (const raw of createInterface({ input: process.stdin })) {
  const line = raw.replace(/^\x1e/, "").trim();
  if (!line) continue;
  const f = JSON.parse(line);
  const p = f.properties ?? {};
  if (f.geometry.type === "Point") {
    if (p.highway !== "traffic_signals") continue;
    const [x, y] = f.geometry.coordinates;
    tile(key(x, y)).s.push([r6(x), r6(y)]); ns++;
  } else if (f.geometry.type === "LineString" && p.highway) {
    const g = f.geometry.coordinates.map(([x, y]) => [r6(x), r6(y)]);
    const t = {};
    for (const k of KEEP) if (p[k] !== undefined) t[k] = String(p[k]);
    const ks = new Set(g.map(([x, y]) => key(x, y)));
    for (const k of ks) tile(k).w.push({ t, g });
    nw++;
  }
}
for (const [k, v] of tiles) writeFileSync(join(out, `${k}.json`), JSON.stringify(v));
console.log(`signals=${ns} ways=${nw} tiles=${tiles.size} -> ${out}`);

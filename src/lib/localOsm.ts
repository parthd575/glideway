import { sampleLine, SegGrid } from "./geo";
import type { LngLat } from "./types";

export interface WayTags { highway?: string; lit?: string; surface?: string; smoothness?: string; bridge?: string; layer?: string }
export interface OsmData { signals: LngLat[]; grid: SegGrid<WayTags> }

const TILE = 0.25; // must match scripts/build-osm-tiles.mjs
const DIR = process.env.OSM_TILES_DIR ?? "data/osm-tiles";
type Tile = { s: LngLat[]; w: { t: WayTags; g: LngLat[] }[] };
const tileCache = new Map<string, Tile | null>();

async function loadTile(k: string): Promise<Tile | null> {
  if (tileCache.has(k)) return tileCache.get(k)!;
  let t: Tile | null = null;
  try {
    const [{ readFile }, { join }] = await Promise.all([import("node:fs/promises"), import("node:path")]);
    t = JSON.parse(await readFile(join(process.cwd(), DIR, `${k}.json`), "utf8"));
  } catch (e) {
    if ((e as { code?: string }).code !== "ENOENT") throw e; // missing tile = no data there; anything else (no fs) = unavailable
  }
  tileCache.set(k, t);
  return t;
}

/** Signals and road segments near the given routes, read from the local OSM tile extract. Throws if the extract is unavailable. */
export async function fetchLocalOsm(routes: LngLat[][]): Promise<OsmData> {
  const keys = new Set<string>();
  for (const r of routes) for (const [x, y] of sampleLine(r, 500)) {
    // include neighbours so features within ~30 m of a tile edge are found
    for (const dx of [-0.001, 0.001]) for (const dy of [-0.001, 0.001]) keys.add(`${Math.floor((x + dx) / TILE)}_${Math.floor((y + dy) / TILE)}`);
  }
  const tiles = await Promise.all([...keys].map(loadTile));
  if (!tiles.some(Boolean)) throw new Error("No local OSM tiles for this area");
  const signals: LngLat[] = [];
  const grid = new SegGrid<WayTags>();
  const seenWays = new Set<object>();
  for (const t of tiles) {
    if (!t) continue;
    signals.push(...t.s);
    for (const w of t.w) {
      if (seenWays.has(w)) continue;
      seenWays.add(w);
      for (let i = 1; i < w.g.length; i++) grid.add({ a: w.g[i - 1], b: w.g[i], data: w.t });
    }
  }
  return { signals, grid };
}

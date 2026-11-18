import { sampleLine, SegGrid } from "./geo";
import type { LngLat } from "./types";

export interface WayTags { highway?: string; lit?: string; surface?: string; smoothness?: string; bridge?: string; layer?: string; maxspeed?: string }
export interface OsmData { signals: LngLat[]; grid: SegGrid<WayTags> }

const TILE = 0.1; // must match scripts/build-osm-tiles.mjs
const DIR = process.env.OSM_TILES_DIR ?? "data/osm-tiles";
const CELL = 0.002; // ~200 m: coarse corridor used to skip features far from the routes
type Tile = { s: LngLat[]; w: { t: WayTags; g: LngLat[] }[] };
const tileCache = new Map<string, Tile | null>();
const MAX_CACHED_TILES = 24;

type AssetFetcher = { fetch(r: Request): Promise<Response> };

/** In production the tiles ship as static assets (public/osm) and are read through the Worker's ASSETS binding. */
async function assetBinding(): Promise<AssetFetcher | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as { ASSETS?: AssetFetcher };
    return env.ASSETS ?? null;
  } catch { return null; } // not running on Workers
}

async function readTile(k: string): Promise<Tile | null> {
  const assets = await assetBinding();
  if (assets) {
    const res = await assets.fetch(new Request(`https://assets.local/osm/${k}.json`));
    if (res.status === 404) return null; // no data in this square
    if (!res.ok) throw new Error(`OSM tile ${k}: ${res.status}`);
    return (await res.json()) as Tile;
  }
  try {
    const [{ readFile }, { join }] = await Promise.all([import("node:fs/promises"), import("node:path")]);
    return JSON.parse(await readFile(join(process.cwd(), DIR, `${k}.json`), "utf8"));
  } catch (e) {
    if ((e as { code?: string }).code !== "ENOENT") throw e; // missing tile = no data there; anything else = unavailable
    return null;
  }
}

async function loadTile(k: string): Promise<Tile | null> {
  if (tileCache.has(k)) return tileCache.get(k)!;
  const t = await readTile(k);
  if (tileCache.size >= MAX_CACHED_TILES) tileCache.delete(tileCache.keys().next().value as string);
  tileCache.set(k, t);
  return t;
}

const cellKey = (x: number, y: number) => `${Math.floor(x / CELL)}:${Math.floor(y / CELL)}`;

/** Signals and road segments near the given routes, read from the local OSM tile extract. Throws if the extract is unavailable. */
export async function fetchLocalOsm(routes: LngLat[][]): Promise<OsmData> {
  const keys = new Set<string>();
  const near = new Set<string>();
  for (const r of routes) {
    for (const [x, y] of sampleLine(r, 500)) {
      // include neighbours so features within ~30 m of a tile edge are found
      for (const dx of [-0.001, 0.001]) for (const dy of [-0.001, 0.001]) keys.add(`${Math.floor((x + dx) / TILE)}_${Math.floor((y + dy) / TILE)}`);
    }
    for (const [x, y] of sampleLine(r, 100)) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) near.add(cellKey(x + i * CELL, y + j * CELL));
  }
  const tiles = await Promise.all([...keys].map(loadTile));
  if (!tiles.some(Boolean)) throw new Error("No local OSM tiles for this area");
  const signals: LngLat[] = [];
  const grid = new SegGrid<WayTags>();
  const seen = new Set<string>();
  for (const t of tiles) {
    if (!t) continue;
    for (const p of t.s) if (near.has(cellKey(p[0], p[1]))) signals.push(p);
    for (const w of t.w) {
      if (!w.g.some((p) => near.has(cellKey(p[0], p[1])))) continue; // only index roads along the routes
      const id = `${w.g[0][0]},${w.g[0][1]},${w.g.length}`; // ways crossing a tile edge appear in both tiles
      if (seen.has(id)) continue;
      seen.add(id);
      for (let i = 1; i < w.g.length; i++) grid.add({ a: w.g[i - 1], b: w.g[i], data: w.t });
    }
  }
  return { signals, grid };
}

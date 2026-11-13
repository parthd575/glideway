import { haversine, sampleLine, SegGrid } from "./geo";
import type { LngLat, Marker, RouteResponse, ScoredRoute } from "./types";
import type { ModeId } from "./modes";
import { fetchLocalOsm } from "./localOsm";

// Comma-separated list, tried in order (public servers sometimes reject requests from cloud hosts).
const OSRM_URLS = (process.env.OSRM_URL ?? "https://router.project-osrm.org,https://routing.openstreetmap.de/routed-car").split(",");
const OVERPASS = (process.env.OVERPASS_URLS ?? "https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter").split(",");
const UA = { "User-Agent": "GlideWay/0.1 (route scoring demo)", "ngrok-skip-browser-warning": "1" };

interface Candidate { coordinates: LngLat[]; distanceM: number; durationS: number }

async function osrm(coords: LngLat[], alternatives: boolean): Promise<Candidate[]> {
  const path = coords.map((c) => c.join(",")).join(";");
  let lastErr: unknown = new Error("OSRM unavailable");
  for (const base of OSRM_URLS) {
    try {
      const url = `${base}/route/v1/driving/${path}?alternatives=${alternatives ? 3 : false}&overview=full&geometries=geojson&steps=false&annotations=false`;
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`OSRM ${res.status}`);
      const json = await res.json();
      if (json.code !== "Ok") throw new Error(`OSRM ${json.code}`);
      return json.routes.map((r: { geometry: { coordinates: LngLat[] }; distance: number; duration: number }) => ({
        coordinates: r.geometry.coordinates, distanceM: r.distance, durationS: r.duration,
      }));
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

/** Fetch OSRM alternatives; if fewer than 3 distinct paths, add detours via perpendicular midpoint offsets. */
export async function fetchCandidates(from: LngLat, to: LngLat): Promise<Candidate[]> {
  const detourVia = (): LngLat[] => {
    const mid: LngLat = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const len = Math.hypot(dx, dy) || 1;
    const off = 0.18; // fraction of trip length
    return [
      [mid[0] - (dy / len) * len * off, mid[1] + (dx / len) * len * off],
      [mid[0] + (dy / len) * len * off, mid[1] - (dx / len) * len * off],
    ];
  };
  // Fire base + detour requests concurrently (detours don't depend on the base result).
  const [baseRes, ...extra] = await Promise.allSettled([
    osrm([from, to], true),
    ...detourVia().map((v) => osrm([from, v, to], false)),
  ]);
  if (baseRes.status === "rejected") throw baseRes.reason;
  const base = baseRes.value;
  const out = [...base];
  {
    for (const r of extra) if (r.status === "fulfilled") {
      const c = r.value[0];
      const fastest = base[0].durationS;
      // keep only sensible detours (<60% slower) that differ from existing paths
      if (c.durationS < fastest * 1.6 && out.every((o) => pathOverlap(o.coordinates, c.coordinates) < 0.85)) out.push(c);
    }
  }
  return out.slice(0, 6);
}

/** Fraction of b's samples lying within 40 m of path a. */
function pathOverlap(a: LngLat[], b: LngLat[]): number {
  const grid = new SegGrid<null>();
  for (let i = 1; i < a.length; i++) grid.add({ a: a[i - 1], b: a[i], data: null });
  const s = sampleLine(b, 100);
  return s.filter((p) => grid.nearest(p, 40)).length / s.length;
}

interface WayTags { highway?: string; lit?: string; surface?: string; smoothness?: string; bridge?: string; layer?: string }
interface OverpassData { signals: LngLat[]; grid: SegGrid<WayTags> }

const cache = new Map<string, { t: number; data: OverpassData }>();

/** Query only features within ~30 m of the candidate routes (a polyline `around` filter) instead of the whole bbox:
 *  a city-wide bbox of every residential street is huge and made public Overpass mirrors time out. */
async function fetchOverpass(routes: LngLat[][]): Promise<OverpassData> {
  const polys = routes.map((r) => sampleLine(r, 150).map(([x, y]) => `${y.toFixed(5)},${x.toFixed(5)}`).join(","));
  const roads = "motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link";
  const parts = polys.map((pl) => `node["highway"="traffic_signals"](around:25,${pl});way["highway"~"^(${roads})$"](around:30,${pl});`).join("");
  const q = `[out:json][timeout:8];(${parts});out tags geom;`;
  const key = q;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < 1000 * 60 * 30) return hit.data;
  const ctrl = new AbortController();
  const one = async (ep: string): Promise<OverpassData> => {
    const res = await fetch(ep, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.any([ctrl.signal, AbortSignal.timeout(8000)]) });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const json = await res.json();
    const signals: LngLat[] = [];
    const grid = new SegGrid<WayTags>();
    for (const el of json.elements ?? []) {
      if (el.type === "node") signals.push([el.lon, el.lat]);
      else if (el.type === "way" && el.geometry) {
        const g: LngLat[] = el.geometry.map((p: { lon: number; lat: number }) => [p.lon, p.lat]);
        for (let i = 1; i < g.length; i++) grid.add({ a: g[i - 1], b: g[i], data: el.tags ?? {} });
      }
    }
    return { signals, grid };
  };
  // Race all mirrors instead of trying them one after another (a slow first mirror used to cost its full timeout).
  try {
    const data = await Promise.any(OVERPASS.map(one));
    ctrl.abort();
    cache.set(key, { t: Date.now(), data });
    return data;
  } catch (e) {
    ctrl.abort();
    throw e instanceof AggregateError ? (e.errors[0] ?? new Error("Overpass failed")) : e;
  }
}

const MAJOR = new Set(["motorway", "trunk", "primary", "motorway_link", "trunk_link", "primary_link"]);
const PAVED = new Set(["asphalt", "concrete", "paved", "concrete:plates", "concrete:lanes", "paving_stones"]);

function litValue(t: WayTags | undefined): number {
  if (!t) return 0.3;
  if (t.lit === "yes" || t.lit === "24/7" || t.lit === "automatic") return 1;
  if (t.lit === "no") return 0;
  switch (t.highway) { // lit tag missing: estimate from road class
    case "motorway": case "trunk": case "primary": return 0.7;
    case "secondary": return 0.55;
    case "tertiary": return 0.4;
    default: return 0.25;
  }
}

function smoothValue(t: WayTags | undefined): number {
  if (!t) return 0.4;
  if (t.smoothness && ["bad", "very_bad", "horrible", "very_horrible", "impassable"].includes(t.smoothness)) return 0;
  if (t.surface) return PAVED.has(t.surface) ? (t.highway && MAJOR.has(t.highway) ? 1 : 0.85) : 0.1;
  if (t.highway && MAJOR.has(t.highway)) return 0.9;
  if (t.highway === "secondary") return 0.75;
  if (t.highway === "tertiary") return 0.55;
  return 0.35;
}

function enrich(c: Candidate, data: OverpassData): Omit<ScoredRoute, "mode"> {
  const samples = sampleLine(c.coordinates, 40);
  const sigGrid = new SegGrid<null>(0.002);
  for (let i = 1; i < c.coordinates.length; i++) sigGrid.add({ a: c.coordinates[i - 1], b: c.coordinates[i], data: null });
  const sigPts = data.signals.filter((p) => sigGrid.nearest(p, 20));
  // collapse signal nodes within 30 m of each other (both carriageways / multi-node junctions)
  const signals: LngLat[] = [];
  for (const p of sigPts) if (signals.every((q) => haversine(p, q) > 30)) signals.push(p);

  let lit = 0, smooth = 0;
  const markers: Marker[] = signals.map((p) => ({ type: "signal", lng: p[0], lat: p[1] }));
  let litRun: LngLat[] = [], bridgeRun: LngLat[] = [], flyovers = 0;
  const flush = () => {
    if (litRun.length >= 8) { const m = litRun[Math.floor(litRun.length / 2)]; markers.push({ type: "lit", lng: m[0], lat: m[1] }); }
    litRun = [];
  };
  const flushBridge = () => {
    if (bridgeRun.length >= 3) { flyovers++; const m = bridgeRun[Math.floor(bridgeRun.length / 2)]; markers.push({ type: "flyover", lng: m[0], lat: m[1] }); }
    bridgeRun = [];
  };
  for (const p of samples) {
    const hit = data.grid.nearest(p, 25);
    const tags = hit?.seg.data;
    const l = litValue(tags);
    lit += l; smooth += smoothValue(tags);
    if (l >= 0.99) litRun.push(p); else flush();
    if (tags?.bridge && tags.bridge !== "no" && tags.highway && MAJOR.has(tags.highway) || (tags?.bridge === "yes" && Number(tags.layer ?? 0) >= 1)) bridgeRun.push(p); else flushBridge();
  }
  flush(); flushBridge();
  const n = Math.max(samples.length, 1);
  return { coordinates: c.coordinates, distanceM: c.distanceM, durationS: c.durationS, signals: signals.length, litPct: Math.round((lit / n) * 100), smoothPct: Math.round((smooth / n) * 100), flyovers, markers };
}

type Enriched = Omit<ScoredRoute, "mode">;

const norm = (v: number, min: number, max: number) => (max === min ? 0.5 : (v - min) / (max - min));

/** Assign the 4 modes. Prefers distinct physical paths unless one clearly dominates. */
export function assignModes(routes: Enriched[]): ScoredRoute[] {
  const dur = routes.map((r) => r.durationS), sig = routes.map((r) => r.signals), sm = routes.map((r) => r.smoothPct), li = routes.map((r) => r.litPct);
  const rng = (a: number[]) => [Math.min(...a), Math.max(...a)] as const;
  const [d0, d1] = rng(dur), [s0, s1] = rng(sig), [m0, m1] = rng(sm), [l0, l1] = rng(li);
  const score: Record<ModeId, (r: Enriched) => number> = {
    fastest: (r) => 1 - norm(r.durationS, d0, d1),
    "signal-free": (r) => 0.75 * (1 - norm(r.signals, s0, s1)) + 0.25 * (1 - norm(r.durationS, d0, d1)),
    "better-roads": (r) => 0.75 * norm(r.smoothPct, m0, m1) + 0.25 * (1 - norm(r.durationS, d0, d1)),
    "night-safe": (r) => 0.7 * norm(r.litPct, l0, l1) + 0.2 * norm(r.smoothPct, m0, m1) + 0.1 * (1 - norm(r.durationS, d0, d1)),
  };
  const order: ModeId[] = ["fastest", "signal-free", "better-roads", "night-safe"];
  const used = new Map<number, ModeId>();
  const out: ScoredRoute[] = [];
  for (const mode of order) {
    const scored = routes.map((r, i) => ({ i, s: score[mode](r) })).sort((a, b) => b.s - a.s);
    const best = scored[0];
    const alt = scored.find((x) => !used.has(x.i));
    const pick = alt && best.s - alt.s <= 0.12 ? alt : best; // prefer a distinct path if nearly as good
    const same = used.get(pick.i);
    if (!same) used.set(pick.i, mode);
    out.push({ ...routes[pick.i], mode, sameAs: same });
  }
  return out;
}

export async function computeRoutes(from: LngLat, to: LngLat): Promise<RouteResponse> {
  const cands = await fetchCandidates(from, to);
  const lines = cands.map((c) => c.coordinates);
  // Prefer the local OSM extract (no rate limits); fall back to Overpass if it's unavailable (e.g. on Cloudflare Workers).
  const data = await fetchLocalOsm(lines).catch(() => fetchOverpass(lines)).catch(() => null);
  const note = data ? undefined : "OpenStreetMap detail service was busy, so signal counts and lighting/smoothness are estimates.";
  const empty: OverpassData = { signals: [], grid: new SegGrid<WayTags>() };
  const enriched = cands.map((c) => enrich(c, data ?? empty));
  return { routes: assignModes(enriched), source: data ? "live" : "partial", note };
}

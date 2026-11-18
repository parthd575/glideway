import { haversine, sampleLine, SegGrid } from "../geo";
import type { LngLat, Marker, ScoredRoute, SpeedLimit } from "../types";
import type { ModeId } from "../modes";
import type { Candidate } from "./osrm";
import type { OverpassData, WayTags } from "./overpass";

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

/** Posted limit from an OSM `maxspeed` tag, in km/h. Handles "50", "50 km/h" and "30 mph". */
export function parseMaxspeed(v?: string): number | null {
  if (!v) return null;
  const m = /^\s*(\d{1,3})\s*(mph|km\/h)?\s*$/i.exec(v);
  if (!m) return null; // "walk", "IN:urban", lists like "60;40" are skipped
  const n = Number(m[1]) * (m[2]?.toLowerCase() === "mph" ? 1.609 : 1);
  return n >= 5 && n <= 140 ? Math.round(n / 5) * 5 : null;
}

/** Typical limits on Indian roads, used where no limit is tagged. These are estimates, not posted limits. */
const CLASS_LIMIT: Record<string, number> = { motorway: 100, motorway_link: 60, trunk: 80, trunk_link: 50, primary: 60, primary_link: 40, secondary: 50, secondary_link: 40, tertiary: 40, unclassified: 40, residential: 30 };

function limitFor(t: WayTags | undefined): { kph: number; est: boolean } | null {
  if (!t) return null;
  const posted = parseMaxspeed(t.maxspeed);
  if (posted) return { kph: posted, est: false };
  const c = t.highway ? CLASS_LIMIT[t.highway] : undefined;
  return c ? { kph: c, est: true } : null;
}

/** Drop limit changes shorter than 150 m (tagging gaps and junction stubs) so the sign doesn't flicker. */
export function smoothLimits(l: SpeedLimit[]): SpeedLimit[] {
  const out: SpeedLimit[] = [];
  l.forEach((e, i) => {
    const len = (l[i + 1]?.fromM ?? Infinity) - e.fromM;
    if (len < 150 && i < l.length - 1) { if (!out.length) out.push({ ...e, kph: l[i + 1].kph, est: l[i + 1].est, fromM: 0 }); return; }
    const prev = out[out.length - 1];
    if (prev && prev.kph === e.kph && !!prev.est === !!e.est) return;
    out.push(out.length ? e : { ...e, fromM: 0 });
  });
  return out;
}

export function enrich(c: Candidate, data: OverpassData): Omit<ScoredRoute, "mode"> {
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
  const speedLimits: SpeedLimit[] = [];
  for (let si = 0; si < samples.length; si++) {
    const p = samples[si];
    const hit = data.grid.nearest(p, 25);
    const tags = hit?.seg.data;
    const lim = limitFor(tags);
    const prevLim = speedLimits[speedLimits.length - 1];
    if (lim && (!prevLim || prevLim.kph !== lim.kph || !!prevLim.est !== lim.est)) speedLimits.push({ fromM: Math.round(si * 40), kph: lim.kph, ...(lim.est ? { est: true } : {}) });
    const l = litValue(tags);
    lit += l; smooth += smoothValue(tags);
    if (l >= 0.99) litRun.push(p); else flush();
    if (tags?.bridge && tags.bridge !== "no" && tags.highway && MAJOR.has(tags.highway) || (tags?.bridge === "yes" && Number(tags.layer ?? 0) >= 1)) bridgeRun.push(p); else flushBridge();
  }
  flush(); flushBridge();
  const n = Math.max(samples.length, 1);
  return { coordinates: c.coordinates, distanceM: c.distanceM, durationS: c.durationS, steps: c.steps, speedLimits: smoothLimits(speedLimits), signals: signals.length, litPct: Math.round((lit / n) * 100), smoothPct: Math.round((smooth / n) * 100), flyovers, markers };
}

export type Enriched = Omit<ScoredRoute, "mode">;

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


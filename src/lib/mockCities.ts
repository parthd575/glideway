import type { LngLat, Marker, Place, RouteResponse, ScoredRoute } from "./types";
import type { ModeId } from "./modes";

export const DEMO_FROM: Place = { label: "SG Highway (Iscon Cross Roads)", sublabel: "Ahmedabad", lng: 72.5077, lat: 23.03 };
export const DEMO_TO: Place = { label: "Sardar Vallabhbhai Patel Airport", sublabel: "Ahmedabad", lng: 72.6347, lat: 23.0772 };

function smooth(pts: LngLat[], per = 12): LngLat[] {
  const out: LngLat[] = [];
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < p.length - 2; i++) {
    for (let t = 0; t < per; t++) {
      const u = t / per, u2 = u * u, u3 = u2 * u;
      const f = (k: 0 | 1) => 0.5 * (2 * p[i][k] + (-p[i - 1][k] + p[i + 1][k]) * u + (2 * p[i - 1][k] - 5 * p[i][k] + 4 * p[i + 1][k] - p[i + 2][k]) * u2 + (-p[i - 1][k] + 3 * p[i][k] - 3 * p[i + 1][k] + p[i + 2][k]) * u3);
      out.push([f(0), f(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const A: LngLat = [DEMO_FROM.lng, DEMO_FROM.lat];
const B: LngLat = [DEMO_TO.lng, DEMO_TO.lat];

const PATHS: Record<ModeId, LngLat[]> = {
  fastest: [A, [72.523, 23.042], [72.545, 23.056], [72.575, 23.064], [72.605, 23.071], B],
  "signal-free": [A, [72.518, 23.05], [72.54, 23.07], [72.575, 23.082], [72.61, 23.085], B],
  "better-roads": [A, [72.512, 23.035], [72.535, 23.045], [72.57, 23.052], [72.605, 23.06], B],
  "night-safe": [A, [72.516, 23.046], [72.538, 23.062], [72.572, 23.073], [72.606, 23.08], B],
};

// Illustrative metrics for the offline sample — not measured data.
const META: Record<ModeId, Pick<ScoredRoute, "distanceM" | "durationS" | "signals" | "litPct" | "smoothPct" | "flyovers">> = {
  fastest: { distanceM: 15200, durationS: 1380, signals: 9, litPct: 41, smoothPct: 52, flyovers: 1 },
  "signal-free": { distanceM: 17100, durationS: 1500, signals: 2, litPct: 66, smoothPct: 78, flyovers: 3 },
  "better-roads": { distanceM: 16400, durationS: 1560, signals: 5, litPct: 62, smoothPct: 94, flyovers: 2 },
  "night-safe": { distanceM: 16800, durationS: 1470, signals: 4, litPct: 95, smoothPct: 85, flyovers: 2 },
};

function markers(coords: LngLat[], mode: ModeId): Marker[] {
  const m: Marker[] = [];
  const at = (f: number) => coords[Math.min(coords.length - 1, Math.floor(coords.length * f))];
  const n = META[mode].signals;
  for (let i = 0; i < n; i++) { const p = at((i + 1) / (n + 1)); m.push({ type: "signal", lng: p[0], lat: p[1] }); }
  for (let i = 0; i < META[mode].flyovers; i++) { const p = at(0.2 + (i * 0.6) / Math.max(META[mode].flyovers, 1)); m.push({ type: "flyover", lng: p[0], lat: p[1] }); }
  if (META[mode].litPct > 60) for (const f of [0.15, 0.4, 0.65, 0.88]) { const p = at(f); m.push({ type: "lit", lng: p[0], lat: p[1] }); }
  return m;
}

export function sampleRoutes(): RouteResponse {
  const routes = (Object.keys(PATHS) as ModeId[]).map((mode) => {
    const coordinates = smooth(PATHS[mode]);
    return { mode, coordinates, ...META[mode], markers: markers(coordinates, mode) } satisfies ScoredRoute;
  });
  return {
    routes, source: "sample",
    note: "Illustrative sample paths and metrics (live routing services were unreachable). Real routes use OSRM + OpenStreetMap data.",
  };
}

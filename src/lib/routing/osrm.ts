import { sampleLine, SegGrid } from "../geo";
import type { LngLat, Step } from "../types";

// Comma-separated list, tried in order (public servers sometimes reject requests from cloud hosts).
const OSRM_URLS = (process.env.OSRM_URL ?? "https://router.project-osrm.org,https://routing.openstreetmap.de/routed-car").split(",");
export const UA = { "User-Agent": "GlideWay/0.1 (route scoring demo)", "ngrok-skip-browser-warning": "1" };

export interface Candidate { coordinates: LngLat[]; distanceM: number; durationS: number; steps: Step[] }

interface OsrmStep { distance: number; duration: number; name: string; maneuver: { type: string; modifier?: string; location: LngLat; exit?: number } }
interface OsrmLeg { steps: OsrmStep[] }
interface OsrmRoute { geometry: { coordinates: LngLat[] }; distance: number; duration: number; legs: OsrmLeg[] }

/** Flatten legs into one step list. Via-points added for detours are not real stops, so their arrive/depart steps are dropped. */
function toSteps(legs: OsrmLeg[]): Step[] {
  const out: Step[] = [];
  let at = 0;
  legs.forEach((leg, li) => {
    for (const s of leg.steps) {
      const t = s.maneuver.type;
      if ((t === "arrive" && li < legs.length - 1) || (t === "depart" && li > 0)) {
        // not a real manoeuvre: fold its length into the previous step so cumulative distances stay exact
        const prev = out[out.length - 1];
        if (prev) { prev.distanceM += s.distance; prev.durationS += s.duration; }
        at += s.distance;
        continue;
      }
      out.push({ type: t, modifier: s.maneuver.modifier, name: s.name, exit: s.maneuver.exit, distanceM: s.distance, durationS: s.duration, startM: at, lng: s.maneuver.location[0], lat: s.maneuver.location[1] });
      at += s.distance;
    }
  });
  return out;
}

async function osrm(coords: LngLat[], alternatives: boolean): Promise<Candidate[]> {
  const path = coords.map((c) => c.join(",")).join(";");
  let lastErr: unknown = new Error("OSRM unavailable");
  for (const base of OSRM_URLS) {
    try {
      const url = `${base}/route/v1/driving/${path}?alternatives=${alternatives ? 3 : false}&overview=full&geometries=geojson&steps=true&annotations=false`;
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`OSRM ${res.status}`);
      const json = await res.json();
      if (json.code !== "Ok") throw new Error(`OSRM ${json.code}`);
      return (json.routes as OsrmRoute[]).map((r) => ({ coordinates: r.geometry.coordinates, distanceM: r.distance, durationS: r.duration, steps: toSteps(r.legs) }));
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

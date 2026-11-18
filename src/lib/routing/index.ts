import { SegGrid } from "../geo";
import type { LngLat, RouteResponse } from "../types";
import { fetchLocalOsm } from "../localOsm";
import { fetchCandidates } from "./osrm";
import { fetchOverpass, type OverpassData, type WayTags } from "./overpass";
import { assignModes, enrich } from "./scoring";
import { mergeLegs } from "./merge";

import { MAX_STOPS } from "./limits";
export { MAX_STOPS };

async function computeLeg(from: LngLat, to: LngLat) {
  const cands = await fetchCandidates(from, to);
  const lines = cands.map((c) => c.coordinates);
  // Prefer the local OSM extract (no rate limits); fall back to Overpass if it's unavailable (e.g. on Cloudflare Workers).
  const data = await fetchLocalOsm(lines).catch(() => fetchOverpass(lines)).catch(() => null);
  const empty: OverpassData = { signals: [], grid: new SegGrid<WayTags>() };
  return { routes: assignModes(cands.map((c) => enrich(c, data ?? empty))), live: !!data };
}

/** Routes from `from` to `to`, optionally through ordered `via` stops. Each leg is scored independently, then joined per mode. */
export async function computeRoutes(from: LngLat, to: LngLat, via: LngLat[] = []): Promise<RouteResponse> {
  const pts = [from, ...via.slice(0, MAX_STOPS), to];
  const legs = await Promise.all(pts.slice(1).map((p, i) => computeLeg(pts[i], p)));
  const live = legs.every((l) => l.live);
  const note = live ? undefined : "OpenStreetMap detail service was busy, so signal counts and lighting/smoothness are estimates.";
  return { routes: mergeLegs(legs.map((l) => l.routes)), source: live ? "live" : "partial", note };
}

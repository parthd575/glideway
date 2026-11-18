import { sampleLine, SegGrid } from "../geo";
import type { LngLat } from "../types";
import { UA } from "./osrm";

const OVERPASS = (process.env.OVERPASS_URLS ?? "https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter").split(",");

export interface WayTags { highway?: string; lit?: string; surface?: string; smoothness?: string; bridge?: string; layer?: string }
export interface OverpassData { signals: LngLat[]; grid: SegGrid<WayTags> }

const cache = new Map<string, { t: number; data: OverpassData }>();

/** Query only features within ~30 m of the candidate routes (a polyline `around` filter) instead of the whole bbox:
 *  a city-wide bbox of every residential street is huge and made public Overpass mirrors time out. */
export async function fetchOverpass(routes: LngLat[][]): Promise<OverpassData> {
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

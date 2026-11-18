import type { LngLat, RouteResponse } from "../types";

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 200;
const mem = new Map<string, { t: number; data: RouteResponse }>();

/** Round to ~11 m so near-identical requests share an entry. */
const r4 = (p: LngLat) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
export const routeKey = (from: LngLat, to: LngLat, via: LngLat[]) => [from, ...via, to].map(r4).join(";");

type EdgeCache = { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> };
const edge = (): EdgeCache | null => {
  const c = (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches;
  return c?.default ?? null;
};
const edgeReq = (key: string) => new Request(`https://route-cache.glideway.internal/${encodeURIComponent(key)}`);

/** Two-tier cache: per-isolate memory first, then the Cloudflare edge cache shared across isolates. */
export async function getCached(key: string): Promise<RouteResponse | null> {
  const hit = mem.get(key);
  if (hit && Date.now() - hit.t < TTL_MS) return hit.data;
  try {
    const res = await edge()?.match(edgeReq(key));
    if (res) { const data = (await res.json()) as RouteResponse; mem.set(key, { t: Date.now(), data }); return data; }
  } catch { /* edge cache unavailable */ }
  return null;
}

export async function putCached(key: string, data: RouteResponse): Promise<void> {
  if (data.source !== "live") return; // never pin degraded or sample results
  if (mem.size >= MAX_ENTRIES) mem.delete(mem.keys().next().value as string);
  mem.set(key, { t: Date.now(), data });
  try {
    await edge()?.put(edgeReq(key), new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${TTL_MS / 1000}` } }));
  } catch { /* ignore */ }
}

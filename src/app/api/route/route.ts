import { NextRequest, NextResponse } from "next/server";
import { computeRoutes, MAX_STOPS } from "@/lib/routing";
import { getCached, putCached, routeKey } from "@/lib/server/routeCache";
import { sampleRoutes, DEMO_FROM, DEMO_TO } from "@/lib/mockCities";
import { inGujarat, REGION_NAME } from "@/lib/region";
import type { LngLat } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function parse(v: string | null): LngLat | null {
  if (!v) return null;
  const [lng, lat] = v.split(",").map(Number);
  return Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lng, lat] : null;
}

/** GET /api/route?from=lng,lat&to=lng,lat[&via=lng,lat;lng,lat]   (add &sample=1 for offline illustrative data) */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const from = parse(sp.get("from"));
  const to = parse(sp.get("to"));
  if (!from || !to) return NextResponse.json({ error: "from and to must be 'lng,lat'" }, { status: 400 });

  const viaRaw = sp.get("via");
  const via = viaRaw ? viaRaw.split(";").map(parse) : [];
  if (via.some((v) => !v) || via.length > MAX_STOPS) return NextResponse.json({ error: `via must be up to ${MAX_STOPS} 'lng,lat' pairs separated by ';'` }, { status: 400 });
  const stops = via as LngLat[];

  if (![from, to, ...stops].every(inGujarat)) return NextResponse.json({ error: `GlideWay currently supports routes within ${REGION_NAME} only.` }, { status: 400 });

  const isDemo = Math.abs(from[0] - DEMO_FROM.lng) < 1e-4 && Math.abs(to[0] - DEMO_TO.lng) < 1e-4;
  if (sp.get("sample") === "1") return NextResponse.json(sampleRoutes());

  try {
    const key = routeKey(from, to, stops);
    const hit = await getCached(key);
    if (hit) return NextResponse.json(hit, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", "X-Route-Cache": "HIT" } });
    const data = await computeRoutes(from, to, stops);
    await putCached(key, data);
    return NextResponse.json(data, { headers: { "Cache-Control": data.source === "live" ? "public, s-maxage=300, stale-while-revalidate=600" : "no-store", "X-Route-Cache": "MISS" } });
  } catch (e) {
    // Never leave the demo button dead: fall back to clearly-labelled sample data.
    if (isDemo) return NextResponse.json(sampleRoutes());
    return NextResponse.json({ error: e instanceof Error ? e.message : "Routing failed" }, { status: 502 });
  }
}

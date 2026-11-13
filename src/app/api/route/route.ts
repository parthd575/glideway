import { NextRequest, NextResponse } from "next/server";
import { computeRoutes } from "@/lib/routingEngine";
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

/** GET /api/route?from=lng,lat&to=lng,lat   (add &sample=1 for offline illustrative data) */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const from = parse(sp.get("from"));
  const to = parse(sp.get("to"));
  if (!from || !to) return NextResponse.json({ error: "from and to must be 'lng,lat'" }, { status: 400 });

  if (!inGujarat(from) || !inGujarat(to)) return NextResponse.json({ error: `GlideWay currently supports routes within ${REGION_NAME} only.` }, { status: 400 });

  const isDemo = Math.abs(from[0] - DEMO_FROM.lng) < 1e-4 && Math.abs(to[0] - DEMO_TO.lng) < 1e-4;
  if (sp.get("sample") === "1") return NextResponse.json(sampleRoutes());

  try {
    const data = await computeRoutes(from, to);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
  } catch (e) {
    // Never leave the demo button dead: fall back to clearly-labelled sample data.
    if (isDemo) return NextResponse.json(sampleRoutes());
    return NextResponse.json({ error: e instanceof Error ? e.message : "Routing failed" }, { status: 502 });
  }
}

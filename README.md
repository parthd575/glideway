# GlideWay

Context-aware navigation: Fastest, Signal-Free, Better Roads and Night-Safe routes.

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Framer Motion · MapLibre GL (react-map-gl) · OSRM · Overpass · Photon.

## Run
```bash
npm install     # postinstall copies the MapLibre worker into public/maplibre
npm run dev     # http://localhost:3000  (landing)  /app  (map)
```

## How routing works (`src/lib/routingEngine.ts`)
1. OSRM returns up to 3 alternatives; if fewer than 4 distinct paths exist, detours via perpendicular waypoints are added.
2. One Overpass query over the route bbox fetches `highway=traffic_signals` nodes and road ways (`lit`, `surface`, `smoothness`, `bridge`).
3. Each route is sampled every 40 m; signals within 20 m are counted (merged within 30 m), `lit`/`surface` are matched to the nearest way. Missing tags are estimated from road class (flagged in the UI).
4. Modes are assigned by weighted, min-max normalised scores, preferring distinct paths when nearly as good.

If Overpass is down, routes still return with estimates (`source: "partial"`). The demo button falls back to labelled illustrative data (`source: "sample"`).

Env (optional): `OSRM_URL`, `OVERPASS_URLS` (comma-separated), `NEXT_PUBLIC_SITE_URL` (OpenGraph base).

## Deploy
Push to GitHub, import in Vercel. The OSRM public demo server and Photon are for light/demo use; self-host (or GraphHopper) before real traffic.

<div align="center">

# GlideWay

**Context-aware navigation that knows the difference between fast and good.**

Four routes for every trip: **Fastest**, **Signal-Free**, **Better Roads** and **Night-Safe**.

[Live demo](https://glideway-web.techguidebro.workers.dev) · [Try the demo route](https://glideway-web.techguidebro.workers.dev/app?demo=1)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-6-396CB2)
![Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white)

![GlideWay landing page](docs/screenshots/landing.png)

</div>

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [How routing works](#how-routing-works)
- [Local OSM data pipeline](#local-osm-data-pipeline)
- [Project structure](#project-structure)
- [Deployment](#deployment)
- [Limitations](#limitations)
- [Data attribution](#data-attribution)

## Overview

Standard navigation optimises for one number: time. GlideWay scores each candidate route on the things drivers actually care about (traffic signals, road surface quality and street lighting) and offers a distinct route for each priority. After 9 PM the app switches to night mode and recommends the Night-Safe route.

Coverage is currently **Gujarat, India** only (see `src/lib/region.ts`).

## Features

| Mode | Optimises for |
| --- | --- |
| **Fastest** | Lowest travel time |
| **Signal-Free** | Fewest traffic signals along the path |
| **Better Roads** | Smoothest surfaces, highest share of well-maintained roads |
| **Night-Safe** | Highest share of lit roads; auto-enabled after 9 PM and before 5 AM |

- Place search with autocomplete (Photon geocoder), swap and demo-route shortcuts
- Per-route metrics: duration, distance, signal count, % smooth, % lit
- Shareable URLs (`/app?from=lng,lat&to=lng,lat&mode=…`) and native share on mobile
- Responsive layout: side panel on desktop, draggable bottom sheet on phones
- Honest data handling: where OSM tags are missing, values are estimated from road class and the UI says so

## Tech stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **UI:** Tailwind CSS v4, Framer Motion, lucide-react
- **Map:** MapLibre GL via `react-map-gl`
- **Routing:** OSRM (self-hosted or public mirrors)
- **Road data:** OpenStreetMap, from a local tile extract or the Overpass API
- **Hosting:** Cloudflare Workers via `@opennextjs/cloudflare`

## Getting started

**Prerequisites:** Node.js 20+ and npm.

```bash
git clone https://github.com/parthd575/glideway.git
cd glideway
npm install        # postinstall copies the MapLibre worker into public/maplibre
npm run dev        # http://localhost:3000 (landing) and /app (map)
```

Other scripts:

| Command | Description |
| --- | --- |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Build and preview on the Cloudflare runtime locally |
| `npm run deploy` | Build and deploy to Cloudflare Workers |

## Configuration

All variables are optional.

| Variable | Description | Default |
| --- | --- | --- |
| `OSRM_URL` | Comma-separated OSRM base URLs, tried in a race | Public OSRM demo and OSM Germany servers |
| `OVERPASS_URLS` | Comma-separated Overpass mirrors | `overpass-api.de`, `overpass.kumi.systems` |
| `OSM_TILES_DIR` | Directory of pre-built OSM tiles | `data/osm-tiles` |
| `NEXT_PUBLIC_SITE_URL` | Base URL for OpenGraph metadata | `https://glideway.vercel.app` |

For the deployed Worker, `OSRM_URL` is set under `vars` in `wrangler.jsonc`.

## How routing works

The engine lives in `src/lib/routingEngine.ts`.

1. **Candidates.** OSRM returns up to three alternatives. If fewer than four distinct paths exist, detours via perpendicular waypoints are added.
2. **Road data.** Traffic signals (`highway=traffic_signals`) and road ways (`lit`, `surface`, `smoothness`, `bridge`) near the candidates are loaded from the local OSM extract. If it is unavailable, for example on Workers, one Overpass query over the route bounding box is used, racing all configured mirrors.
3. **Scoring.** Each route is sampled every 40 m. Signals within 20 m are counted (merged within 30 m), and `lit`/`surface` are matched to the nearest way. Missing tags are estimated from road class.
4. **Mode assignment.** Modes are chosen from weighted, min-max normalised scores, preferring distinct paths when they are nearly as good.

The `/api/route` response includes a `source` field:

| `source` | Meaning |
| --- | --- |
| `live` | Scored with real OSM data |
| `partial` | OSM data unavailable; signal, lighting and smoothness values are estimates |
| `sample` | Labelled illustrative data (demo fallback) |

## Local OSM data pipeline

To avoid Overpass rate limits, GlideWay can read signals and road tags from tiles prebuilt from an OSM extract.

```bash
# 1. Download a regional extract (e.g. Geofabrik) and filter it with osmium
osmium tags-filter gujarat-latest.osm.pbf w/highway n/highway=traffic_signals -o filtered.osm.pbf

# 2. Convert to 0.25° JSON tiles in data/osm-tiles
osmium export filtered.osm.pbf -f geojsonseq --geometry-types=point,linestring \
  | node scripts/build-osm-tiles.mjs
```

The tile size is defined in both `scripts/build-osm-tiles.mjs` and `src/lib/localOsm.ts` and must match. Extracts and tiles are git-ignored.

## Project structure

```
src/
  app/
    page.tsx            Landing page
    app/                Map application (AppClient.tsx)
    api/route/route.ts  Routing endpoint
  components/
    landing/            Hero, problem contrast, route showcase, tech flow
    map/                MapCanvas, RouteSidebar, NightModeToggle
  lib/
    routingEngine.ts    Candidate generation, scoring, mode assignment
    localOsm.ts         Local OSM tile reader
    photon.ts           Geocoding client
    region.ts           Gujarat bounds and checks
scripts/                OSM tile builder, MapLibre worker copy
```

## Deployment

The app deploys to Cloudflare Workers with OpenNext:

```bash
npx wrangler login   # first time only
npm run deploy
```

Because Workers have no local filesystem for OSM tiles, production routing uses Overpass for road data and a hosted OSRM endpoint (configured in `wrangler.jsonc`).

## Limitations

- Coverage is limited to Gujarat; points outside it are rejected.
- Public OSRM, Overpass and Photon servers are for light and demo use. Self-host them before serving real traffic.
- Lighting and smoothness depend on OSM tagging quality, which varies by area.

## Data attribution

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), basemap © [CARTO](https://carto.com/attributions).

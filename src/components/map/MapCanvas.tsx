"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GUJARAT_BBOX } from "@/lib/region";
import { setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/maplibre";
import { ArrowUpFromLine, Lightbulb, Navigation2 } from "lucide-react";
import { MODE_BY_ID, ModeId } from "@/lib/modes";
import type { Place, ScoredRoute } from "@/lib/types";
import type { NavPosition } from "@/hooks/useNavigation";
import type { GeoFix } from "@/hooks/useGeolocation";

if (typeof window !== "undefined") setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const STYLES = { dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json", light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" } as const;
// Used if the vector basemap cannot be fetched, so routes still render on a plain dark canvas.
const FALLBACK_STYLE: StyleSpecification = { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#0b1220" } }] };
const DASHES: number[][] = [[0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]];

interface Props {
  routes: ScoredRoute[];
  active: ModeId;
  from: Place | null;
  to: Place | null;
  stops: Place[];
  night: boolean;
  theme: "light" | "dark";
  isMobile: boolean;
  /** live position shown as a blue dot while planning */
  userFix: GeoFix | null;
  /** set while navigating: the camera follows this position */
  navPos: NavPosition | null;
  navigating: boolean;
}

export default function MapCanvas({ routes, active, from, to, stops, night, theme, isMobile, userFix, navPos, navigating }: Props) {
  const ref = useRef<MapRef>(null);
  const [styleFailed, setStyleFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Draw inactive first so the active route sits on top. Skip duplicates (sameAs) of an inactive path.
  const ordered = useMemo(() => [...routes].sort((a, b) => Number(a.mode === active) - Number(b.mode === active)), [routes, active]);
  const activeRoute = routes.find((r) => r.mode === active);

  // Fit to all routes whenever they change
  useEffect(() => {
    const map = ref.current;
    if (!map || routes.length === 0 || navigating) return;
    let w = 180, s = 90, e = -180, n = -90;
    for (const r of routes) for (const [x, y] of r.coordinates) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
    map.fitBounds([[w, s], [e, n]], { padding: isMobile ? { top: 60, left: 30, right: 30, bottom: 280 } : { top: 80, bottom: 80, left: 440, right: 60 }, duration: 1200, maxZoom: 15 });
  }, [routes, isMobile, loaded, navigating]);

  // Navigation camera: follow the driver, heading-up, tilted
  useEffect(() => {
    const map = ref.current;
    if (!map || !navigating || !navPos) return;
    map.easeTo({ center: [navPos.lng, navPos.lat], bearing: navPos.bearing, pitch: 55, zoom: 17, duration: 900, easing: (t) => t, padding: { top: isMobile ? 220 : 260, bottom: 0, left: 0, right: 0 } });
  }, [navPos, navigating, isMobile]);
  useEffect(() => {
    const map = ref.current;
    if (!map || navigating) return;
    map.easeTo({ pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
  }, [navigating]);

  // Fly to a single selected place before routes exist
  useEffect(() => {
    const p = to ?? from;
    if (p && routes.length === 0) ref.current?.flyTo({ center: [p.lng, p.lat], zoom: 13, duration: 900 });
  }, [from, to, routes.length]);

  // Animate: pulsing glow + marching dashes on the active route
  useEffect(() => {
    let raf = 0, step = 0, last = 0;
    const tick = (t: number) => {
      const map = ref.current?.getMap();
      if (map && map.isStyleLoaded()) {
        const glow = `route-${active}-glow`, dash = `route-${active}-dash`;
        if (map.getLayer(glow)) map.setPaintProperty(glow, "line-opacity", 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t / 380)));
        if (map.getLayer(dash) && t - last > 70) {
          step = (step + 1) % DASHES.length;
          map.setPaintProperty(dash, "line-dasharray", DASHES[step]);
          last = t;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, routes]);

  return (
    <div className="absolute inset-0 z-0">
      <Map
        ref={ref}
        initialViewState={{ longitude: 72.57, latitude: 23.05, zoom: 10.5 }}
        maxBounds={[GUJARAT_BBOX[0] - 0.5, GUJARAT_BBOX[1] - 0.5, GUJARAT_BBOX[2] + 0.5, GUJARAT_BBOX[3] + 0.5]}
        minZoom={6}
        mapStyle={styleFailed ? FALLBACK_STYLE : STYLES[theme]}
        onError={(e) => { if (!styleFailed && /style|tile|fetch|Failed/i.test(String(e.error?.message))) setStyleFailed(true); }}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
        onLoad={() => setLoaded(true)}
        reuseMaps
      >
        {ordered.map((r) => {
          const isActive = r.mode === active;
          const color = MODE_BY_ID[r.mode].color;
          const geo = { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: r.coordinates } };
          return (
            <Source key={r.mode} id={`route-${r.mode}`} type="geojson" data={geo}>
              {isActive && <Layer id={`route-${r.mode}-glow`} type="line" layout={{ "line-cap": "round", "line-join": "round" }} paint={{ "line-color": color, "line-width": 18, "line-blur": 12, "line-opacity": 0.5 }} />}
              <Layer id={`route-${r.mode}-line`} type="line" layout={{ "line-cap": "round", "line-join": "round" }} paint={{ "line-color": color, "line-width": isActive ? 6 : 4, "line-opacity": isActive ? 1 : 0.35 }} />
              {isActive && <Layer id={`route-${r.mode}-dash`} type="line" layout={{ "line-cap": "butt", "line-join": "round" }} paint={{ "line-color": "#ffffff", "line-width": 2, "line-opacity": 0.9, "line-dasharray": DASHES[0] }} />}
            </Source>
          );
        })}

        {activeRoute?.markers.slice(0, 80).map((m, i) => (
          <Marker key={`${m.type}-${i}`} longitude={m.lng} latitude={m.lat} anchor="center">
            {m.type === "signal" ? (
              <div title="Traffic signal" className="flex h-5 w-3 flex-col items-center justify-around rounded-sm border border-gray-600 bg-[#111827]"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /><span className="h-1.5 w-1.5 rounded-full bg-gray-600" /></div>
            ) : m.type === "flyover" ? (
              <div title="Flyover / bridge" className="grid h-6 w-6 place-items-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/40"><ArrowUpFromLine size={13} /></div>
            ) : (
              <div title="Well-lit zone" className="relative grid h-8 w-8 place-items-center"><span className="absolute inset-0 rounded-full bg-amber-400/30 blur-md" /><Lightbulb size={14} className="relative text-amber-300" /></div>
            )}
          </Marker>
        ))}

        {userFix && !navigating && (
          <Marker longitude={userFix.lng} latitude={userFix.lat} anchor="center">
            <div title="You are here" className="relative grid h-5 w-5 place-items-center"><span className="user-pulse absolute inset-0 rounded-full bg-blue-500/50" /><span className="relative h-4 w-4 rounded-full border-[3px] border-white bg-blue-500 shadow-lg" /></div>
          </Marker>
        )}
        {navigating && navPos && (
          <Marker longitude={navPos.lng} latitude={navPos.lat} anchor="center" rotation={navPos.bearing} rotationAlignment="map" pitchAlignment="map">
            <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-blue-500 text-white shadow-xl shadow-blue-500/50"><Navigation2 size={22} fill="currentColor" /></div>
          </Marker>
        )}
        {stops.map((s, i) => (
          <Marker key={`stop-${i}`} longitude={s.lng} latitude={s.lat} anchor="center"><div className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-amber-500 text-[11px] font-bold text-black shadow-lg">{i + 1}</div></Marker>
        ))}
        {from && !navigating && <Marker longitude={from.lng} latitude={from.lat}><div className="h-4 w-4 rounded-full border-4 border-emerald-400 bg-white shadow-lg" /></Marker>}
        {to && <Marker longitude={to.lng} latitude={to.lat}><div className="h-5 w-5 rounded-full border-4 border-white bg-red-500 shadow-lg" /></Marker>}
      </Map>
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${night && theme === "dark" ? "opacity-100" : "opacity-0"}`} style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(120,53,15,0.35) 100%)", mixBlendMode: "multiply" }} />
    </div>
  );
}

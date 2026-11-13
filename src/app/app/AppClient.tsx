"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import RouteSidebar from "@/components/map/RouteSidebar";
import { MODES, ModeId } from "@/lib/modes";
import { DEMO_FROM, DEMO_TO } from "@/lib/mockCities";
import type { Place, RouteResponse } from "@/lib/types";

const MapCanvas = dynamic(() => import("@/components/map/MapCanvas"), { ssr: false });

const isMode = (v: string | null): v is ModeId => !!v && MODES.some((m) => m.id === v);

function parsePlace(coord: string | null, name: string | null): Place | null {
  if (!coord) return null;
  const [lng, lat] = coord.split(",").map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat, label: name || `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
}

export default function AppClient() {
  const sp = useSearchParams();
  const demoParam = sp.get("demo") === "1";
  const [from, setFrom] = useState<Place | null>(() => (demoParam ? DEMO_FROM : parsePlace(sp.get("from"), sp.get("fromName"))));
  const [to, setTo] = useState<Place | null>(() => (demoParam ? DEMO_TO : parsePlace(sp.get("to"), sp.get("toName"))));
  const [active, setActive] = useState<ModeId>(() => { const m = sp.get("mode"); return isMode(m) ? m : "fastest"; });
  const [data, setData] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [night, setNightState] = useState(false);
  const [autoNight, setAutoNight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hadModeParam = useRef(isMode(sp.get("mode")));

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const f = () => setIsMobile(mq.matches);
    f(); mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  // Visiting after 9 PM (or before 5 AM) turns night mode on automatically
  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 21 || h < 5) { setNightState(true); setAutoNight(true); if (!hadModeParam.current) setActive("night-safe"); }
  }, []);

  const setNight = useCallback((v: boolean) => {
    setNightState(v); setAutoNight(false);
    if (v) setActive("night-safe");
  }, []);

  // Fetch routes when both ends are set
  useEffect(() => {
    if (!from || !to) { setData(null); return; }
    const ctrl = new AbortController();
    setLoading(true); setError(null);
    const q = `from=${from.lng},${from.lat}&to=${to.lng},${to.lat}`;
    fetch(`/api/route?${q}`, { signal: ctrl.signal })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Routing failed"); return j as RouteResponse; })
      .then((j) => { setData(j); })
      .catch((e) => { if (e.name !== "AbortError") { setData(null); setError(`${e.message}. Check your connection or try different points.`); } })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [from, to]);

  // Keep the URL shareable: ?from=lng,lat&to=lng,lat&mode=night-safe
  useEffect(() => {
    if (!from || !to) { if (window.location.search) window.history.replaceState(null, "", "/app"); return; }
    const u = new URLSearchParams({ from: `${from.lng.toFixed(5)},${from.lat.toFixed(5)}`, to: `${to.lng.toFixed(5)},${to.lat.toFixed(5)}`, mode: active, fromName: from.label, toName: to.label });
    window.history.replaceState(null, "", `/app?${u}`);
  }, [from, to, active]);

  const onDemo = () => { setFrom(DEMO_FROM); setTo(DEMO_TO); };
  const onSwap = () => { setFrom(to); setTo(from); };

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-background">
      <MapCanvas routes={data?.routes ?? []} active={active} from={from} to={to} night={night} isMobile={isMobile} />
      <RouteSidebar from={from} to={to} setFrom={setFrom} setTo={setTo} onDemo={onDemo} onSwap={onSwap} data={data} loading={loading} error={error} active={active} setActive={setActive} night={night} autoNight={autoNight} setNight={setNight} isMobile={isMobile} />
    </main>
  );
}

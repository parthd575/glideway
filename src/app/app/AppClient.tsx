"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import RouteSidebar from "@/components/planner/RouteSidebar";
import NavigationOverlay from "@/components/nav/NavigationOverlay";
import ConsentDialog from "@/components/ui/ConsentDialog";
import type { QuickPick } from "@/components/planner/PlaceInput";
import { MODES, MODE_BY_ID, ModeId } from "@/lib/modes";
import { DEMO_FROM, DEMO_TO } from "@/lib/mockCities";
import { inGujarat, REGION_NAME } from "@/lib/region";
import { MAX_STOPS } from "@/lib/routing/limits";
import { decodePlaces, encodePlaces, parsePlace } from "@/lib/shareUrl";
import type { LngLat, Place, RouteResponse, ScoredRoute } from "@/lib/types";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNavigation } from "@/hooks/useNavigation";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useTheme } from "@/hooks/useTheme";
import { useLocationConsent } from "@/hooks/useConsent";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import { useTripHistory } from "@/hooks/useTripHistory";
import type { Trip } from "@/lib/storage";

const MapCanvas = dynamic(() => import("@/components/map/MapCanvas"), { ssr: false });

const isMode = (v: string | null): v is ModeId => !!v && MODES.some((m) => m.id === v);
const filled = (s: (Place | null)[]) => s.filter((x): x is Place => !!x);
const viaParam = (s: Place[]) => (s.length ? `&via=${s.map((p) => `${p.lng},${p.lat}`).join(";")}` : "");

export default function AppClient() {
  const sp = useSearchParams();
  const demoParam = sp.get("demo") === "1";
  const [from, setFrom] = useState<Place | null>(() => (demoParam ? DEMO_FROM : parsePlace(sp.get("from"), sp.get("fromName"))));
  const [to, setTo] = useState<Place | null>(() => (demoParam ? DEMO_TO : parsePlace(sp.get("to"), sp.get("toName"))));
  const [stops, setStops] = useState<(Place | null)[]>(() => decodePlaces(sp.get("via"), sp.get("viaName")).slice(0, MAX_STOPS));
  const [active, setActive] = useState<ModeId>(() => { const m = sp.get("mode"); return isMode(m) ? m : "fastest"; });
  const [data, setData] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [night, setNightState] = useState(false);
  const [autoNight, setAutoNight] = useState(false);
  const [showMe, setShowMe] = useState(false);
  const [ready, setReady] = useState(false); // theme + night state decided; avoids loading the wrong basemap first
  const [navigating, setNavigating] = useState(false);
  const [simulate, setSimulate] = useState(false);
  const [voice, setVoice] = useState(true);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const hadModeParam = useRef(isMode(sp.get("mode")));
  const install = usePwaInstall();
  const geo = useGeolocation(showMe && !navigating);
  const consent = useLocationConsent();
  const saved = useSavedPlaces();
  const history = useTripHistory();
  const tripId = useRef<string | null>(null);

  const theme = useTheme(night);
  const readyStops = useMemo(() => filled(stops), [stops]);
  const stopsKey = readyStops.map((s) => `${s.lng},${s.lat}`).join(";");
  const pendingStop = stops.some((s) => !s); // an empty row is waiting to be filled in
  const effectiveTheme = theme.resolved;

  // Visiting after 9 PM (or before 5 AM) turns night mode on automatically
  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 21 || h < 5) { setNightState(true); setAutoNight(true); if (!hadModeParam.current) setActive("night-safe"); }
    setReady(true);
  }, []);

  const setNight = useCallback((v: boolean) => {
    setNightState(v); setAutoNight(false);
    if (v) setActive("night-safe");
  }, []);

  // Fetch routes when both ends are set (and no stop row is still empty)
  useEffect(() => {
    if (!from || !to || pendingStop) { setData(null); return; }
    const ctrl = new AbortController();
    setLoading(true); setError(null);
    const q = `from=${from.lng},${from.lat}&to=${to.lng},${to.lat}${viaParam(readyStops)}`;
    fetch(`/api/route?${q}`, { signal: ctrl.signal })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Routing failed"); return j as RouteResponse; })
      .then((j) => { setData(j); })
      .catch((e) => { if (e.name !== "AbortError") { setData(null); setError(`${e.message}. Check your connection or try different points.`); } })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
    // stopsKey stands in for readyStops so the effect doesn't refire on identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, stopsKey, pendingStop]);

  // Keep the URL shareable: ?from=lng,lat&to=lng,lat&via=lng,lat;lng,lat&mode=night-safe
  useEffect(() => {
    if (!from || !to) { if (window.location.search) window.history.replaceState(null, "", "/app"); return; }
    const u = new URLSearchParams({ from: `${from.lng.toFixed(5)},${from.lat.toFixed(5)}`, to: `${to.lng.toFixed(5)},${to.lat.toFixed(5)}`, mode: active, fromName: from.label, toName: to.label });
    if (readyStops.length) { const e = encodePlaces(readyStops); u.set("via", e.via); u.set("viaName", e.names); }
    window.history.replaceState(null, "", `/app?${u}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, active, stopsKey]);

  const onDemo = () => { setFrom(DEMO_FROM); setTo(DEMO_TO); setStops([]); };
  const onSwap = () => { setFrom(to); setTo(from); setStops((s) => [...s].reverse()); };

  const onLocateFrom = useCallback(async () => {
    setNotice(null);
    if (!(await consent.ensure())) return;
    try {
      const f = await geo.locate();
      if (!inGujarat([f.lng, f.lat])) { setNotice(`You appear to be outside ${REGION_NAME}. GlideWay only covers ${REGION_NAME} for now.`); return; }
      setFrom({ label: "My location", sublabel: "Current GPS position", lng: f.lng, lat: f.lat });
      setShowMe(true);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Couldn't get your location."); }
  }, [geo, consent]);

  const activeRoute = data?.routes.find((r) => r.mode === active) ?? null;

  // Re-route from the driver's current position through the stops they haven't reached yet
  const onOffRoute = useCallback(async (pos: LngLat, progressM: number, cur: ScoredRoute) => {
    if (!to) return null;
    const left = cur.stopsM?.length ?? 0;
    const passed = (cur.stopsM ?? []).filter((m) => m <= progressM).length;
    const remaining = readyStops.slice(readyStops.length - left).slice(passed);
    const res = await fetch(`/api/route?from=${pos[0]},${pos[1]}&to=${to.lng},${to.lat}${viaParam(remaining)}`);
    if (!res.ok) return null;
    const j = (await res.json()) as RouteResponse;
    return j.routes.find((r) => r.mode === cur.mode) ?? null;
  }, [to, readyStops]);

  const nav = useNavigation({ route: activeRoute, running: navigating, simulate, voice, onOffRoute });

  const startNav = async (sim: boolean) => {
    if (!sim && !(await consent.ensure())) return;
    setSimulate(sim); setNavigating(true);
    if (from && to && activeRoute) {
      tripId.current = history.add({ from, to, stops: readyStops, mode: active, distanceM: activeRoute.distanceM, durationS: activeRoute.durationS, simulated: sim });
    }
  };
  const endNav = () => { setNavigating(false); tripId.current = null; };

  // Mark the trip as completed on arrival
  const arrived = !!nav.progress?.arrived;
  useEffect(() => { if (navigating && arrived && tripId.current) history.complete(tripId.current); }, [arrived, navigating, history]);

  const quick = useMemo<QuickPick[]>(() => {
    const out: QuickPick[] = saved.places.map((s) => ({ place: s.place, tag: s.kind, name: s.name }));
    const seen = new Set(out.map((q) => `${q.place.lat},${q.place.lng}`));
    for (const t of history.trips) {
      const k = `${t.to.lat},${t.to.lng}`;
      if (seen.has(k) || out.length >= 8) continue;
      seen.add(k); out.push({ place: t.to, tag: "recent", name: t.to.label });
    }
    return out;
  }, [saved.places, history.trips]);

  const library = useMemo(() => ({
    places: saved.places, trips: history.trips,
    onRemovePlace: saved.remove, onRemoveTrip: history.remove, onClearTrips: history.clear,
    onUseTrip: (t: Trip) => { setFrom(t.from); setTo(t.to); setStops(t.stops); setActive(t.mode); },
    onUsePlace: (p: Place, as: "from" | "to") => (as === "from" ? setFrom(p) : setTo(p)),
  }), [saved.places, saved.remove, history.trips, history.remove, history.clear]);

  const mapRoutes = useMemo(() => (navigating && nav.navRoute ? [nav.navRoute] : data?.routes ?? []), [navigating, nav.navRoute, data]);

  return (
    <main data-theme={effectiveTheme} className="app-root relative h-dvh w-screen overflow-hidden bg-background">
      {ready && <MapCanvas routes={mapRoutes} active={active} from={from} to={to} stops={readyStops} night={night} theme={effectiveTheme} isMobile={isMobile} userFix={geo.fix} navPos={nav.position} navigating={navigating} />}
      {navigating && nav.prepared ? (
        <NavigationOverlay prepared={nav.prepared} progress={nav.progress} color={MODE_BY_ID[active].color} voice={voice} onVoice={setVoice} onEnd={endNav} rerouting={nav.rerouting} geoStatus={nav.geoStatus} simulate={simulate} speedMps={nav.speedMps} />
      ) : (
        <RouteSidebar
          from={from} to={to} stops={stops} setFrom={setFrom} setTo={setTo} setStops={setStops}
          onDemo={onDemo} onSwap={onSwap} onLocateFrom={onLocateFrom}
          data={data} loading={loading} error={error} notice={notice}
          active={active} setActive={setActive} night={night} autoNight={autoNight} setNight={setNight}
          theme={theme.pref} setTheme={theme.setPref} onStartNav={startNav}
          canInstall={install.canInstall} onInstall={install.install} quick={quick} onSavePlace={saved.save} library={library} isMobile={isMobile}
        />
      )}
      {consent.asking && <ConsentDialog onAnswer={consent.answer} />}
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pointAt } from "@/lib/geo";
import { locate, OFF_ROUTE_M, prepareRoute, type NavProgress } from "@/lib/navigation";
import { speak } from "@/lib/directions";
import type { LngLat, ScoredRoute } from "@/lib/types";
import { useGeolocation, type GeoStatus } from "./useGeolocation";

export interface NavPosition { lng: number; lat: number; bearing: number; accuracy: number }

interface Options {
  route: ScoredRoute | null;
  running: boolean;
  simulate: boolean;
  voice: boolean;
  /** called when the driver leaves the route; return a replacement route or null */
  onOffRoute: (pos: LngLat, progressM: number, current: ScoredRoute) => Promise<ScoredRoute | null>;
}

const SIM_SPEED_MPS = 22;

export function useNavigation({ route, running, simulate, voice, onOffRoute }: Options) {
  const [navRoute, setNavRoute] = useState<ScoredRoute | null>(route);
  const [progress, setProgress] = useState<NavProgress | null>(null);
  const [position, setPosition] = useState<NavPosition | null>(null);
  const [rerouting, setRerouting] = useState(false);
  const [rerouteCount, setRerouteCount] = useState(0);
  const [speedMps, setSpeedMps] = useState<number | null>(null);
  const { fix, status } = useGeolocation(running && !simulate);

  const prepared = useMemo(() => (navRoute ? prepareRoute(navRoute) : null), [navRoute]);
  const seg = useRef(0);
  const offCount = useRef(0);
  const lastReroute = useRef(0);
  const spoken = useRef(new Set<string>());
  const busy = useRef(false);

  // Fresh route each time navigation starts
  useEffect(() => {
    if (!running) return;
    setNavRoute(route); setProgress(null); setPosition(null); setRerouteCount(0);
    seg.current = 0; offCount.current = 0; spoken.current = new Set();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handleFix = useCallback((pos: LngLat, heading: number | null, accuracy: number, moving: boolean, speed: number | null) => {
    if (!prepared) return;
    const p = locate(prepared, pos, seg.current);
    if (!p) return;
    seg.current = p.segIndex;
    setProgress(p);
    setSpeedMps(speed);
    const onRoute = p.offRouteM <= OFF_ROUTE_M;
    const shown = onRoute ? p.snapped : pos;
    const a = prepared.line[Math.min(p.segIndex, prepared.line.length - 2)], b = prepared.line[Math.min(p.segIndex + 1, prepared.line.length - 1)];
    const routeBearing = Math.atan2((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * 180 / Math.PI;
    setPosition({ lng: shown[0], lat: shown[1], bearing: heading != null && moving ? heading : (routeBearing + 360) % 360, accuracy });

    offCount.current = onRoute ? 0 : offCount.current + 1;
    if (!simulate && offCount.current >= 3 && !busy.current && Date.now() - lastReroute.current > 8000 && !p.arrived) {
      busy.current = true; lastReroute.current = Date.now(); setRerouting(true);
      onOffRoute(pos, p.progressM, navRoute!)
        .then((r) => { if (r) { setNavRoute(r); seg.current = 0; offCount.current = 0; spoken.current = new Set(); setRerouteCount((n) => n + 1); } })
        .catch(() => { /* keep guiding on the old route; retry after the cooldown */ })
        .finally(() => { busy.current = false; setRerouting(false); });
    }
  }, [prepared, navRoute, simulate, onOffRoute]);

  // Real GPS
  useEffect(() => {
    if (!running || simulate || !fix) return;
    handleFix([fix.lng, fix.lat], fix.heading, fix.accuracy, (fix.speed ?? 0) > 1, fix.speed);
  }, [fix, running, simulate, handleFix]);

  // Simulated drive along the route (for demos and testing without moving)
  useEffect(() => {
    if (!running || !simulate || !prepared) return;
    let m = 0;
    const t = setInterval(() => {
      m = Math.min(prepared.totalM, m + SIM_SPEED_MPS);
      const { point, bearing } = pointAt(prepared.line, prepared.cum, m);
      handleFix(point, bearing, 5, true, SIM_SPEED_MPS);
    }, 1000);
    return () => clearInterval(t);
  }, [running, simulate, prepared, handleFix]);

  // Voice guidance: once at ~300 m and once when the manoeuvre is imminent
  useEffect(() => {
    if (!running || !voice || !progress || !prepared || typeof speechSynthesis === "undefined") return;
    const step = prepared.steps[progress.nextIndex];
    if (!step) return;
    const stage = progress.distToNextM < 40 ? "now" : progress.distToNextM < 320 ? "soon" : null;
    if (!stage) return;
    const key = `${progress.nextIndex}:${stage}`;
    if (spoken.current.has(key)) return;
    spoken.current.add(key);
    const u = new SpeechSynthesisUtterance(step.type === "arrive" ? speak(step, 0) : speak(step, stage === "now" ? 0 : progress.distToNextM));
    u.lang = "en-IN";
    speechSynthesis.speak(u);
  }, [running, voice, progress, prepared]);
  useEffect(() => { if (!running && typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); }, [running]);

  // Keep the screen awake while navigating
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const get = () => navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => { /* not allowed */ });
    get();
    const vis = () => { if (document.visibilityState === "visible") get(); };
    document.addEventListener("visibilitychange", vis);
    return () => { document.removeEventListener("visibilitychange", vis); lock?.release().catch(() => {}); };
  }, [running]);

  return { navRoute, prepared, progress, position, speedMps, rerouting, rerouteCount, geoStatus: (simulate ? "active" : status) as GeoStatus };
}

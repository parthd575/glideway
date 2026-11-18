"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GeoFix { lng: number; lat: number; accuracy: number; heading: number | null; speed: number | null; ts: number }
export type GeoStatus = "idle" | "locating" | "active" | "denied" | "unavailable";

const toFix = (p: GeolocationPosition): GeoFix => ({ lng: p.coords.longitude, lat: p.coords.latitude, accuracy: p.coords.accuracy, heading: p.coords.heading, speed: p.coords.speed, ts: p.timestamp });

/** Current position. `watch` keeps a live subscription (used for the blue dot and navigation); `locate()` is a one-shot request. */
export function useGeolocation(watch: boolean) {
  const [fix, setFix] = useState<GeoFix | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const id = useRef<number | null>(null);

  const fail = useCallback((e: GeolocationPositionError) => setStatus(e.code === e.PERMISSION_DENIED ? "denied" : "unavailable"), []);

  useEffect(() => {
    if (!watch) return;
    if (!("geolocation" in navigator)) { setStatus("unavailable"); return; }
    setStatus((s) => (s === "active" ? s : "locating"));
    id.current = navigator.geolocation.watchPosition((p) => { setFix(toFix(p)); setStatus("active"); }, fail, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
    return () => { if (id.current !== null) navigator.geolocation.clearWatch(id.current); id.current = null; };
  }, [watch, fail]);

  const locate = useCallback(() => new Promise<GeoFix>((resolve, reject) => {
    if (!("geolocation" in navigator)) { setStatus("unavailable"); reject(new Error("Location is not available on this device")); return; }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => { const f = toFix(p); setFix(f); setStatus("active"); resolve(f); },
      (e) => { fail(e); reject(new Error(e.code === e.PERMISSION_DENIED ? "Location permission was denied. Allow it in your browser settings." : "Couldn't get your location. Try again outdoors.")); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
  }), [fail]);

  return { fix, status, locate };
}

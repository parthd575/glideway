import type { ModeId } from "./modes";
import type { Place } from "./types";

/** Everything GlideWay remembers lives in this browser only (localStorage). Nothing is sent to a server. */
export const STORE_PREFIX = "glideway:";
const EVENT = "glideway-storage";

export type PlaceKind = "home" | "work" | "fav";
export interface SavedPlace { id: string; kind: PlaceKind; name: string; place: Place; ts: number }
export interface Trip {
  id: string; ts: number; from: Place; to: Place; stops: Place[]; mode: ModeId;
  distanceM: number; durationS: number; completed: boolean; simulated: boolean;
}

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export function writeStore<T>(key: string, value: T): void {
  try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: key })); } catch { /* ignore */ }
}

export function subscribeStore(key: string, cb: () => void): () => void {
  const onLocal = (e: Event) => { if ((e as CustomEvent).detail === key) cb(); };
  const onOther = (e: StorageEvent) => { if (e.key === STORE_PREFIX + key) cb(); };
  window.addEventListener(EVENT, onLocal);
  window.addEventListener("storage", onOther);
  return () => { window.removeEventListener(EVENT, onLocal); window.removeEventListener("storage", onOther); };
}

/** Delete saved places, trip history, theme and consent. Does not touch the service-worker cache. */
export function clearAllLocalData(): void {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(STORE_PREFIX)) localStorage.removeItem(k);
  } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: "*" })); } catch { /* ignore */ }
}

export const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

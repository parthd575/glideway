import type { Place } from "./types";

export function parsePlace(coord: string | null, name: string | null): Place | null {
  if (!coord) return null;
  const [lng, lat] = coord.split(",").map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat, label: name || `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
}

/** Stops are stored as `via=lng,lat;lng,lat` with `viaName=a|b` (separators are stripped from names). */
export function encodePlaces(places: Place[]): { via: string; names: string } {
  return {
    via: places.map((p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(";"),
    names: places.map((p) => p.label.replace(/[|;]/g, " ")).join("|"),
  };
}

export function decodePlaces(via: string | null, names: string | null): Place[] {
  if (!via) return [];
  const labels = (names ?? "").split("|");
  return via.split(";").map((c, i) => parsePlace(c, labels[i] || null)).filter((p): p is Place => !!p);
}

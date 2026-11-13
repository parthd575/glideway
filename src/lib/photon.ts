import type { Place } from "./types";
import { GUJARAT_BBOX, inGujarat } from "./region";

// Gujarat plus the Daman & Diu UT, which sits inside the bounding box.
const GUJARAT_STATES = /gujarat|daman|diu|dadra/i;

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; street?: string; housenumber?: string; district?: string; city?: string; state?: string; country?: string; osm_value?: string };
}

export async function searchPlaces(q: string, bias?: { lat: number; lng: number }, signal?: AbortSignal): Promise<Place[]> {
  if (q.trim().length < 2) return [];
  const u = new URL("https://photon.komoot.io/api/");
  u.searchParams.set("q", q);
  u.searchParams.set("limit", "12"); // over-fetch: results are filtered to Gujarat below
  u.searchParams.set("bbox", GUJARAT_BBOX.join(",")); // restrict suggestions to Gujarat
  if (bias) { u.searchParams.set("lat", String(bias.lat)); u.searchParams.set("lon", String(bias.lng)); }
  const res = await fetch(u, { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as { features: PhotonFeature[] };
  return json.features.filter((f) => inGujarat(f.geometry.coordinates) && (!f.properties.state || GUJARAT_STATES.test(f.properties.state))).slice(0, 6).map((f) => {
    const p = f.properties;
    const label = p.name ?? [p.housenumber, p.street].filter(Boolean).join(" ") ?? "Unnamed";
    const sub = [p.street && p.name ? p.street : null, p.district, p.city, p.state, p.country].filter(Boolean).join(", ");
    return { label: label || sub, sublabel: sub, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
  });
}

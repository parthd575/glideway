import type { LngLat } from "./types";

/** GlideWay currently serves Gujarat only. Bounding box [west, south, east, north] (includes Diu/Daman; also clips small edges of neighbouring states). */
export const GUJARAT_BBOX: [number, number, number, number] = [68.1, 20.05, 74.5, 24.75];
export const REGION_NAME = "Gujarat";

export function inGujarat([lng, lat]: LngLat): boolean {
  const [w, s, e, n] = GUJARAT_BBOX;
  return lng >= w && lng <= e && lat >= s && lat <= n;
}

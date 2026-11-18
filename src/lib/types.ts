import type { ModeId } from "./modes";

export type LngLat = [number, number];

export interface Marker {
  type: "signal" | "flyover" | "lit";
  lng: number;
  lat: number;
}

/** One manoeuvre of a route. `startM` is the distance from the route start at which it happens. */
export interface Step {
  type: string;
  modifier?: string;
  name: string;
  exit?: number;
  distanceM: number;
  durationS: number;
  startM: number;
  lng: number;
  lat: number;
}

export interface ScoredRoute {
  mode: ModeId;
  /** GeoJSON [lng, lat] coordinates */
  coordinates: LngLat[];
  distanceM: number;
  durationS: number;
  signals: number;
  litPct: number;
  smoothPct: number;
  flyovers: number;
  markers: Marker[];
  /** turn-by-turn manoeuvres, in order (the last one is the arrival) */
  steps?: Step[];
  /** distance from route start at which each intermediate stop is reached */
  stopsM?: number[];
  /** set when this mode's best path is physically identical to another mode's */
  sameAs?: ModeId;
}

export interface RouteResponse {
  routes: ScoredRoute[];
  /** "live" = OSRM + Overpass; "partial" = OSRM + road-class estimates; "sample" = illustrative offline data */
  source: "live" | "partial" | "sample";
  note?: string;
}

export interface Place {
  label: string;
  sublabel?: string;
  lng: number;
  lat: number;
}

import { cumulative, haversine, snapToLine } from "./geo";
import type { LngLat, ScoredRoute, Step } from "./types";

export interface PreparedRoute { line: LngLat[]; cum: number[]; steps: Step[]; totalM: number; totalS: number; stopsM: number[] }

export function prepareRoute(r: ScoredRoute): PreparedRoute {
  const cum = cumulative(r.coordinates);
  return { line: r.coordinates, cum, steps: r.steps ?? [], totalM: cum[cum.length - 1] ?? 0, totalS: r.durationS, stopsM: r.stopsM ?? [] };
}

export interface NavProgress {
  progressM: number;
  offRouteM: number;
  snapped: LngLat;
  segIndex: number;
  /** index in `steps` of the next manoeuvre */
  nextIndex: number;
  distToNextM: number;
  remainingM: number;
  remainingS: number;
  arrived: boolean;
}

export const OFF_ROUTE_M = 60;
export const ARRIVE_M = 30;

/** Locate `pos` on the route and derive what the driver needs to see next. */
export function locate(p: PreparedRoute, pos: LngLat, lastSeg = 0): NavProgress | null {
  let snap = snapToLine(pos, p.line, p.cum, Math.max(0, lastSeg - 5));
  if (!snap || snap.distM > OFF_ROUTE_M) {
    const full = snapToLine(pos, p.line, p.cum, 0, p.line.length); // might have rejoined elsewhere
    if (full && (!snap || full.distM < snap.distM)) snap = full;
  }
  if (!snap) return null;
  const progressM = snap.progressM;
  const remainingM = Math.max(0, p.totalM - progressM);
  let nextIndex = p.steps.findIndex((s) => s.startM > progressM + 1);
  if (nextIndex < 0) nextIndex = Math.max(0, p.steps.length - 1);
  const next = p.steps[nextIndex];
  const distToNextM = next ? Math.max(0, next.startM - progressM) : remainingM;

  // Remaining time from step durations, interpolating inside the current step.
  let remainingS = p.totalS * (p.totalM ? remainingM / p.totalM : 0);
  if (p.steps.length) {
    const j = Math.max(0, nextIndex - 1);
    const cur = p.steps[j];
    const frac = cur.distanceM > 0 ? Math.min(1, Math.max(0, (progressM - cur.startM) / cur.distanceM)) : 1;
    remainingS = cur.durationS * (1 - frac);
    for (let i = j + 1; i < p.steps.length; i++) remainingS += p.steps[i].durationS;
  }
  const arrived = remainingM <= ARRIVE_M || (haversine(pos, p.line[p.line.length - 1]) <= ARRIVE_M && snap.distM <= OFF_ROUTE_M);
  return { progressM, offRouteM: snap.distM, snapped: snap.point, segIndex: snap.index, nextIndex, distToNextM, remainingM, remainingS, arrived };
}

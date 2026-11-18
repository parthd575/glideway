import type { ModeId } from "../modes";
import type { Marker, ScoredRoute, SpeedLimit, Step } from "../types";

/** Join per-leg results (one ScoredRoute per mode per leg) into one route per mode through all stops. */
export function mergeLegs(legs: ScoredRoute[][]): ScoredRoute[] {
  if (legs.length === 1) return legs[0];
  const modes = legs[0].map((r) => r.mode) as ModeId[];
  return modes.map((mode) => {
    const parts = legs.map((l) => l.find((r) => r.mode === mode)!);
    const coordinates: ScoredRoute["coordinates"] = [];
    const markers: Marker[] = [];
    const steps: Step[] = [];
    const stopsM: number[] = [];
    const speedLimits: SpeedLimit[] = [];
    let dist = 0, dur = 0, signals = 0, flyovers = 0, lit = 0, smooth = 0;
    parts.forEach((p, i) => {
      const last = i === parts.length - 1;
      coordinates.push(...(i === 0 ? p.coordinates : p.coordinates.slice(1)));
      markers.push(...p.markers);
      for (const l of p.speedLimits ?? []) speedLimits.push({ ...l, fromM: l.fromM + dist });
      for (const s of p.steps ?? []) {
        if (i > 0 && s.type === "depart") { // the previous leg's "arrive" doubles as this stop; carry the leg's length over
          const prev = steps[steps.length - 1];
          if (prev) { prev.distanceM += s.distanceM; prev.durationS += s.durationS; }
          continue;
        }
        steps.push({ ...s, startM: s.startM + dist, type: s.type === "arrive" && !last ? "waypoint" : s.type });
      }
      dist += p.distanceM; dur += p.durationS; signals += p.signals; flyovers += p.flyovers;
      lit += p.litPct * p.distanceM; smooth += p.smoothPct * p.distanceM;
      if (!last) stopsM.push(dist);
    });
    const d = Math.max(dist, 1);
    return { mode, coordinates, distanceM: dist, durationS: dur, signals, flyovers, litPct: Math.round(lit / d), smoothPct: Math.round(smooth / d), markers, steps, stopsM, speedLimits };
  });
}

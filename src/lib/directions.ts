import type { Step } from "./types";

export type Icon = "straight" | "left" | "right" | "slight-left" | "slight-right" | "sharp-left" | "sharp-right" | "uturn" | "roundabout" | "merge" | "fork-left" | "fork-right" | "depart" | "arrive" | "waypoint";

export function stepIcon(s: Step): Icon {
  const { type, modifier: m } = s;
  if (type === "arrive") return "arrive";
  if (type === "waypoint") return "waypoint";
  if (type === "depart") return "depart";
  if (type === "roundabout" || type === "rotary" || type === "roundabout turn" || type === "exit roundabout" || type === "exit rotary") return "roundabout";
  if (m === "uturn") return "uturn";
  if (type === "merge") return "merge";
  if (type === "fork") return m?.includes("left") ? "fork-left" : "fork-right";
  switch (m) {
    case "left": return "left";
    case "right": return "right";
    case "slight left": return "slight-left";
    case "slight right": return "slight-right";
    case "sharp left": return "sharp-left";
    case "sharp right": return "sharp-right";
    default: return "straight";
  }
}

const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

/** Human-readable instruction for a manoeuvre, e.g. "Turn left onto SG Highway". */
export function describeStep(s: Step): string {
  const road = s.name ? ` onto ${s.name}` : "";
  const on = s.name ? ` on ${s.name}` : "";
  const dir = s.modifier ?? "";
  switch (s.type) {
    case "depart": return s.name ? `Head out on ${s.name}` : "Start driving";
    case "arrive": return "You have arrived at your destination";
    case "waypoint": return "You have reached your stop";
    case "roundabout": case "rotary": case "roundabout turn": return s.exit ? `At the roundabout, take the ${ORD[s.exit] ?? `${s.exit}th`} exit${road}` : `Enter the roundabout${road}`;
    case "exit roundabout": case "exit rotary": return `Exit the roundabout${road}`;
    case "merge": return `Merge ${dir || "ahead"}${road}`.replace("  ", " ");
    case "fork": return `Keep ${dir.includes("left") ? "left" : "right"} at the fork${road}`;
    case "on ramp": return `Take the ramp${road}`;
    case "off ramp": return `Take the exit${road}`;
    case "end of road": return `At the end of the road, turn ${dir}${road}`;
    case "new name": case "continue": return dir && dir !== "straight" ? `Continue ${dir}${on}` : `Continue straight${on}`;
    default:
      if (dir === "uturn") return "Make a U-turn";
      if (dir === "straight" || !dir) return `Continue straight${on}`;
      return `Turn ${dir}${road}`;
  }
}

export function fmtDistance(m: number): string {
  if (m < 50) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  if (Math.round(m / 50) * 50 < 1000) return `${Math.round(m / 50) * 50} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

export function fmtDuration(s: number): string {
  const m = Math.max(1, Math.round(s / 60));
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}

/** Spoken variant: "In 300 metres, turn left onto X". */
export function speak(s: Step, distM: number): string {
  const d = distM < 1000 ? `${Math.max(10, Math.round(distM / 10) * 10)} metres` : `${(distM / 1000).toFixed(1)} kilometres`;
  const text = describeStep(s);
  return distM < 40 ? text : `In ${d}, ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

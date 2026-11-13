export type ModeId = "fastest" | "signal-free" | "better-roads" | "night-safe";

export interface ModeConfig {
  id: ModeId;
  label: string;
  color: string;
  tagline: string;
  blurb: string;
}

export const MODES: ModeConfig[] = [
  { id: "fastest", label: "Fastest", color: "#8B5CF6", tagline: "Shortest ETA", blurb: "The classic. Lowest travel time, no questions asked." },
  { id: "signal-free", label: "Signal-Free", color: "#10B981", tagline: "Fewer red lights", blurb: "Flyovers and continuous roads. Fewer stops, calmer drive." },
  { id: "better-roads", label: "Better Roads", color: "#3B82F6", tagline: "Smooth asphalt", blurb: "Avoids broken inner lanes. Easy on your suspension." },
  { id: "night-safe", label: "Night-Safe", color: "#F59E0B", tagline: "Well-lit corridors", blurb: "Lit arterial roads and active commercial strips after 9 PM." },
];

export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<ModeId, ModeConfig>;

export const SPRING = { type: "spring", stiffness: 300, damping: 28 } as const;

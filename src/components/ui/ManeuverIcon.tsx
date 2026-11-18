import { ArrowUp, ArrowUpLeft, ArrowUpRight, CornerUpLeft, CornerUpRight, Flag, GitFork, MapPin, Merge, Navigation2, RotateCcw, Undo2, type LucideIcon } from "lucide-react";
import type { Icon } from "@/lib/directions";

const MAP: Record<Icon, { C: LucideIcon; flip?: boolean }> = {
  straight: { C: ArrowUp },
  left: { C: CornerUpLeft },
  right: { C: CornerUpRight },
  "slight-left": { C: ArrowUpLeft },
  "slight-right": { C: ArrowUpRight },
  "sharp-left": { C: CornerUpLeft },
  "sharp-right": { C: CornerUpRight },
  uturn: { C: Undo2 },
  roundabout: { C: RotateCcw },
  merge: { C: Merge },
  "fork-left": { C: GitFork },
  "fork-right": { C: GitFork },
  depart: { C: Navigation2 },
  arrive: { C: Flag },
  waypoint: { C: MapPin },
};

export default function ManeuverIcon({ icon, size = 20, className }: { icon: Icon; size?: number; className?: string }) {
  const { C } = MAP[icon];
  return <C size={size} className={className} aria-hidden />;
}

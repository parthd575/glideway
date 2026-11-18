import { ArrowUp } from "lucide-react";
import type { Lane } from "@/lib/types";

const ROT: Record<string, number> = { straight: 0, "slight right": 45, right: 90, "sharp right": 135, uturn: 180, "sharp left": -135, left: -90, "slight left": -45 };

/** Lane arrows for the upcoming manoeuvre. Lanes that lead to the route are bright, the rest are dimmed. */
export default function LaneGuidance({ lanes }: { lanes: Lane[] }) {
  return (
    <div className="flex items-end justify-center gap-1 border-t border-line bg-field px-4 py-2" role="img" aria-label={`Lane guidance: ${lanes.filter((l) => l.ok).length} of ${lanes.length} lanes continue on the route`}>
      {lanes.map((l, i) => {
        const inds = l.ind.filter((x) => x in ROT);
        return (
          <span key={i} className={`relative grid h-9 w-8 place-items-center rounded-md border-x ${l.ok ? "border-ink/60 text-ink" : "border-line text-dim/40"}`}>
            {(inds.length ? inds : ["straight"]).map((d) => <ArrowUp key={d} size={20} strokeWidth={2.5} className="absolute" style={{ transform: `rotate(${ROT[d]}deg)` }} />)}
          </span>
        );
      })}
    </div>
  );
}

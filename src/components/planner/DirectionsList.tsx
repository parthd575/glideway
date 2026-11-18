"use client";

import { useState } from "react";
import { ChevronDown, ListOrdered } from "lucide-react";
import ManeuverIcon from "@/components/ui/ManeuverIcon";
import { describeStep, fmtDistance, stepIcon } from "@/lib/directions";
import type { ScoredRoute } from "@/lib/types";

export default function DirectionsList({ route, color }: { route: ScoredRoute; color: string }) {
  const [open, setOpen] = useState(false);
  const steps = route.steps ?? [];
  if (steps.length < 2) return null;
  return (
    <div className="rounded-2xl border border-line bg-panel2">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between px-3.5 py-3 text-left text-sm font-medium">
        <span className="flex items-center gap-2"><ListOrdered size={15} style={{ color }} /> Turn-by-turn directions <span className="text-xs font-normal text-dim">{steps.length} steps</span></span>
        <ChevronDown size={16} className={`text-dim transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ol className="max-h-72 divide-y divide-line overflow-y-auto overscroll-contain border-t border-line" style={{ touchAction: "pan-y" }}>
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-field" style={{ color }}><ManeuverIcon icon={stepIcon(s)} size={16} /></span>
              <span className="min-w-0 flex-1 text-sm">{describeStep(s)}</span>
              {s.type !== "arrive" && <span className="shrink-0 text-xs text-dim">{fmtDistance(s.distanceM)}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

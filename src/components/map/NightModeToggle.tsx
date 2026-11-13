"use client";

import { Moon } from "lucide-react";

export default function NightModeToggle({ night, auto, onChange }: { night: boolean; auto: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={night} onClick={() => onChange(!night)}
      className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition ${night ? "border-amber-500/60 bg-amber-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
    >
      <span className="flex items-center gap-2.5">
        <Moon size={16} className={night ? "text-amber-400" : "text-gray-400"} />
        <span>
          <span className="block text-sm font-medium">Simulate Night Mode (After 9 PM)</span>
          <span className="block text-xs text-gray-500">{auto && night ? "It's late — turned on automatically" : "Highlights the Night-Safe route"}</span>
        </span>
      </span>
      <span className={`relative h-5 w-9 rounded-full transition ${night ? "bg-amber-500" : "bg-gray-600"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${night ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

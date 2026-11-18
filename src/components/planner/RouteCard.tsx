"use client";

import { motion } from "framer-motion";
import { Lightbulb, Route as RouteIcon, TrafficCone } from "lucide-react";
import { MODES, SPRING } from "@/lib/modes";
import { fmtDuration } from "@/lib/directions";
import type { ScoredRoute } from "@/lib/types";

interface Props { r: ScoredRoute; active: boolean; fastest: ScoredRoute; night: boolean; onSelect: () => void; index: number }

export default function RouteCard({ r, active, fastest, night, onSelect, index }: Props) {
  const m = MODES.find((x) => x.id === r.mode)!;
  const delta = Math.round((r.durationS - fastest.durationS) / 60);
  const pulse = night && r.mode === "night-safe";
  return (
    <motion.button
      layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: index * 0.06 }}
      onClick={onSelect} aria-pressed={active}
      className={`relative w-full rounded-2xl bg-panel2 p-3.5 text-left ${pulse && !active ? "amber-pulse" : ""}`}
      style={{ border: `1px solid ${active ? "transparent" : pulse ? "#F59E0B88" : "var(--line)"}` }}
    >
      {active && <motion.span layoutId="activeRoutePill" transition={SPRING} className="absolute inset-0 rounded-2xl" style={{ border: `2px solid ${m.color}`, boxShadow: `0 0 24px ${m.color}55, inset 0 0 20px ${m.color}18` }} />}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} /><span className="font-semibold" style={{ color: m.color }}>{m.label}</span>{pulse && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">RECOMMENDED</span>}</div>
        <div className="text-right"><div className="text-lg font-bold leading-none">{fmtDuration(r.durationS)}</div><div className="text-[11px] text-dim">{r.mode === "fastest" || delta <= 0 ? "fastest" : `+${delta} min`} · {(r.distanceM / 1000).toFixed(1)} km</div></div>
      </div>
      <div className="relative mt-2.5 grid grid-cols-3 gap-2 text-xs text-soft">
        <span className="flex items-center gap-1"><TrafficCone size={12} className="text-red-400" />{r.signals} signals</span>
        <span className="flex items-center gap-1"><RouteIcon size={12} className="text-blue-400" />{r.smoothPct}% smooth</span>
        <span className="flex items-center gap-1"><Lightbulb size={12} className="text-amber-400" />{r.litPct}% lit</span>
      </div>
      {r.sameAs && <div className="relative mt-2 text-[11px] text-dim">Best path here is the same as {MODES.find((x) => x.id === r.sameAs)!.label}.</div>}
    </motion.button>
  );
}

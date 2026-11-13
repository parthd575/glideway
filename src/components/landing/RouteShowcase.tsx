"use client";

import { motion } from "framer-motion";
import { Gauge, Lightbulb, Route, TrafficCone } from "lucide-react";
import { MODES, ModeId, SPRING } from "@/lib/modes";

function Anim({ id, color }: { id: ModeId; color: string }) {
  if (id === "better-roads") {
    // suspension wave that flattens on hover
    return (
      <svg viewBox="0 0 200 50" className="h-14 w-full">
        <motion.path
          variants={{ rest: { d: "M0 25 Q10 5 20 25 T40 25 T60 25 T80 25 T100 25 T120 25 T140 25 T160 25 T180 25 T200 25" }, hover: { d: "M0 25 Q10 24 20 25 T40 25 T60 25 T80 25 T100 25 T120 25 T140 25 T160 25 T180 25 T200 25" } }}
          transition={{ duration: 0.7 }} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "signal-free") {
    // green wave of lights
    return (
      <div className="flex h-14 items-center justify-between px-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.span key={i} className="h-7 w-7 rounded-full" style={{ background: "#ef4444" }}
            variants={{ rest: { background: "#ef4444", boxShadow: "0 0 0 rgba(0,0,0,0)" }, hover: { background: color, boxShadow: `0 0 16px ${color}`, transition: { delay: i * 0.1 } } }} />
        ))}
      </div>
    );
  }
  if (id === "night-safe") {
    return (
      <div className="flex h-14 items-end justify-around">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="relative flex flex-col items-center">
            <motion.span className="absolute -top-3 h-10 w-10 rounded-full" style={{ background: `radial-gradient(${color}, transparent 70%)` }}
              variants={{ rest: { opacity: 0.1, scale: 0.6 }, hover: { opacity: 0.9, scale: 1.2, transition: { delay: i * 0.08 } } }} />
            <span className="relative h-9 w-0.5 bg-gray-600" /><span className="relative -mt-9 h-1.5 w-3 rounded-full" style={{ background: color }} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="relative flex h-14 items-center">
      <div className="h-1 w-full rounded bg-gray-700" />
      <motion.div className="absolute h-4 w-8 rounded" style={{ background: color }} variants={{ rest: { x: 0 }, hover: { x: 140, transition: { duration: 0.8, ease: "easeIn" } } }} />
    </div>
  );
}

const ICONS = { fastest: Gauge, "signal-free": TrafficCone, "better-roads": Route, "night-safe": Lightbulb };

export default function RouteShowcase() {
  return (
    <section id="modes" className="mx-auto max-w-7xl px-6 py-24">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={SPRING} className="max-w-2xl">
        <h2 className="text-3xl font-bold sm:text-4xl">Four ways to get there. You choose the feel.</h2>
        <p className="mt-3 text-gray-400">Hover or tap a card to see what each mode optimizes for.</p>
      </motion.div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MODES.map((m, i) => {
          const Icon = ICONS[m.id];
          return (
            <motion.div key={m.id} initial="rest" whileHover="hover" whileTap="hover" animate="rest"
              onViewportEnter={() => {}}
              className="group cursor-pointer rounded-2xl border bg-card p-6 transition-shadow hover:shadow-2xl"
              style={{ borderColor: `${m.color}40` }}>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: i * 0.08 }}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${m.color}22`, color: m.color }}><Icon size={20} /></span>
                  <div><div className="font-semibold" style={{ color: m.color }}>{m.label}</div><div className="text-xs text-gray-500">{m.tagline}</div></div>
                </div>
                <div className="my-6"><Anim id={m.id} color={m.color} /></div>
                <p className="text-sm text-gray-400">{m.blurb}</p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

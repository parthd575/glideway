"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { MODES, ModeId, SPRING } from "@/lib/modes";

interface Pt { x: number; y: number }
interface Demo { d: string; signals: Pt[]; lamps: Pt[]; potholes: Pt[]; eta: string; stat: string }

const A = { x: 60, y: 360 };
const B = { x: 540, y: 80 };

const DEMOS: Record<ModeId, Demo> = {
  fastest: {
    d: "M60 360 L180 300 L300 250 L420 170 L540 80",
    signals: [{ x: 120, y: 330 }, { x: 180, y: 300 }, { x: 240, y: 275 }, { x: 300, y: 250 }, { x: 420, y: 170 }, { x: 480, y: 125 }],
    lamps: [],
    potholes: [{ x: 150, y: 315 }, { x: 360, y: 210 }, { x: 460, y: 140 }],
    eta: "24 min", stat: "6 signals · 41% lit · rough patches",
  },
  "signal-free": {
    d: "M60 360 C150 360 210 330 290 300 S440 200 540 80",
    signals: [{ x: 300, y: 292 }],
    lamps: [{ x: 200, y: 335 }, { x: 420, y: 215 }],
    potholes: [],
    eta: "26 min", stat: "1 signal · 3 flyovers · continuous flow",
  },
  "better-roads": {
    d: "M60 360 L60 250 L240 250 L240 140 L540 140 L540 80",
    signals: [{ x: 60, y: 250 }, { x: 240, y: 140 }, { x: 540, y: 140 }],
    lamps: [{ x: 150, y: 250 }, { x: 390, y: 140 }],
    potholes: [],
    eta: "28 min", stat: "93% smooth asphalt · 3 signals",
  },
  "night-safe": {
    d: "M60 360 L160 360 L160 220 L340 220 L340 80 L540 80",
    signals: [{ x: 160, y: 220 }, { x: 340, y: 220 }, { x: 340, y: 80 }],
    lamps: [{ x: 110, y: 360 }, { x: 160, y: 290 }, { x: 250, y: 220 }, { x: 340, y: 150 }, { x: 440, y: 80 }],
    potholes: [],
    eta: "27 min", stat: "96% well-lit · active corridors",
  },
};

const STREETS_H = [80, 140, 220, 250, 300, 360];
const STREETS_V = [60, 160, 240, 340, 420, 540];

export default function HeroSection() {
  const [mode, setMode] = useState<ModeId>("night-safe");
  const m = MODES.find((x) => x.id === mode)!;
  const demo = DEMOS[mode];

  return (
    <section className="relative overflow-hidden pt-24 pb-20 grid-bg">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-3xl transition-colors duration-700" style={{ background: m.color }} />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Navigation that knows the difference between fast and good
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.08 }} className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Stop Taking Dark, Pothole-Filled Shortcuts Just to{" "}
            <span className="bg-gradient-to-r from-violet-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">Save 60 Seconds.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.16 }} className="mt-5 max-w-xl text-lg text-gray-400">
            GlideWay gives you four routes for every trip: fastest, signal-free, smoother roads, and well-lit streets after 9 PM. You pick how the drive should feel.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.24 }} className="mt-8 flex flex-wrap gap-3">
            <Link href="/app?demo=1" className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black transition hover:bg-emerald-400">
              <Play size={16} /> Try the live demo <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </Link>
            <Link href="/app" className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-gray-200 transition hover:bg-white/5">Open the app</Link>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SPRING, delay: 0.2 }} className="glass rounded-3xl p-4 shadow-2xl">
          <div className="mb-3 flex flex-wrap gap-2">
            {MODES.map((x) => (
              <button key={x.id} onClick={() => setMode(x.id)} className="relative rounded-full px-3.5 py-1.5 text-sm font-medium transition" style={{ color: mode === x.id ? "#0b0f19" : x.color, border: `1px solid ${x.color}55` }}>
                {mode === x.id && <motion.span layoutId="heroPill" transition={SPRING} className="absolute inset-0 rounded-full" style={{ background: x.color }} />}
                <span className="relative">{x.label}</span>
              </button>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#0b1220]">
            <svg viewBox="0 0 600 440" className="block w-full" role="img" aria-label="Animated route preview">
              <defs>
                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
                <radialGradient id="lamp"><stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" /><stop offset="100%" stopColor="#F59E0B" stopOpacity="0" /></radialGradient>
              </defs>
              {STREETS_H.map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#1f2937" strokeWidth="6" />)}
              {STREETS_V.map((x) => <line key={x} y1="0" y2="440" x1={x} x2={x} stroke="#1f2937" strokeWidth="6" />)}
              {DEMOS["fastest"].d && <path d={DEMOS.fastest.d} stroke="#1f2937" strokeWidth="6" fill="none" />}

              <AnimatePresence mode="wait">
                <motion.g key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  {demo.lamps.map((p, i) => (
                    <motion.circle key={`l${i}`} cx={p.x} cy={p.y} r="34" fill="url(#lamp)" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0.35, 0.85, 0.35], scale: 1 }} transition={{ opacity: { repeat: Infinity, duration: 2.4, delay: 0.5 + i * 0.2 }, scale: { delay: 0.5 + i * 0.12 } }} />
                  ))}
                  <motion.path d={demo.d} fill="none" stroke={m.color} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" opacity="0.7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeInOut" }} />
                  <motion.path d={demo.d} fill="none" stroke={m.color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeInOut" }} />
                  <path d={demo.d} fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.8" strokeDasharray="6 42" strokeLinecap="round" className="dash-flow" />
                  {demo.potholes.map((p, i) => <ellipse key={`p${i}`} cx={p.x} cy={p.y} rx="7" ry="4" fill="#ef4444" opacity="0.8" />)}
                  {demo.signals.map((p, i) => (
                    <motion.g key={`s${i}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1, ...SPRING }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
                      <rect x={p.x - 5} y={p.y - 11} width="10" height="22" rx="3" fill="#111827" stroke="#374151" />
                      <circle cx={p.x} cy={p.y - 5} r="3" fill="#ef4444" />
                      <circle cx={p.x} cy={p.y + 5} r="3" fill="#374151" />
                    </motion.g>
                  ))}
                </motion.g>
              </AnimatePresence>

              <g>
                <circle cx={A.x} cy={A.y} r="9" fill="#fff" stroke={m.color} strokeWidth="4" />
                <circle cx={B.x} cy={B.y} r="9" fill={m.color} stroke="#fff" strokeWidth="3" />
              </g>
            </svg>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-black/50 px-4 py-2.5 backdrop-blur">
              <div>
                <div className="text-sm font-semibold" style={{ color: m.color }}>{m.label} · {demo.eta}</div>
                <div className="text-xs text-gray-400">{demo.stat}</div>
              </div>
              <div className="text-xs text-gray-500">{m.tagline}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

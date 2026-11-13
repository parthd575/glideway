"use client";

import { motion } from "framer-motion";
import { Database, Map, Radar, Sparkles } from "lucide-react";
import { SPRING } from "@/lib/modes";

const STEPS = [
  { icon: Map, title: "OSRM", text: "Multiple distinct physical paths between A and B.", color: "#8B5CF6" },
  { icon: Database, title: "OpenStreetMap", text: "Signals, lighting and surface tags along each path.", color: "#3B82F6" },
  { icon: Radar, title: "Passive scoring", text: "Signal count, smoothness % and well-lit % per route.", color: "#10B981" },
  { icon: Sparkles, title: "4 routes", text: "Fastest, Signal-Free, Better Roads, Night-Safe.", color: "#F59E0B" },
];

export default function TechFlow() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="text-3xl font-bold sm:text-4xl">No sensors on your phone. No account.</h2>
      <p className="mt-3 max-w-2xl text-gray-400">GlideWay reads open map data and scores every candidate route. Nothing to install, nothing tracking you.</p>
      <div className="relative mt-12 grid gap-6 md:grid-cols-4">
        <svg className="pointer-events-none absolute left-0 top-10 hidden h-2 w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 2">
          <motion.line x1="6" x2="94" y1="1" y2="1" stroke="#374151" strokeWidth="0.4" strokeDasharray="1.5 1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
        </svg>
        {STEPS.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: i * 0.12 }} className="relative rounded-2xl bg-card p-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: `${s.color}22`, color: s.color, boxShadow: `0 0 24px ${s.color}44` }}><s.icon size={24} /></div>
            <div className="mt-4 font-semibold">{s.title}</div>
            <p className="mt-1 text-sm text-gray-400">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

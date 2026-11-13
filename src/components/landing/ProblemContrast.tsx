"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Car, Moon, ArrowRight } from "lucide-react";
import { SPRING } from "@/lib/modes";

export default function ProblemContrast() {
  return (
    <section className="relative overflow-hidden bg-[#0b1020] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={SPRING} className="max-w-3xl text-3xl font-bold sm:text-4xl">
          Standard ETA vs. <span className="text-amber-400">Commuter-First</span>
        </motion.h2>
        <div className="relative mt-12 grid gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.4 }} transition={SPRING}
            className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-950/40 to-card p-6">
            <div className="flex items-center gap-2 text-red-400"><AlertTriangle size={18} /><b>Dark Gali — saves 1 min</b></div>
            <ul className="mt-3 space-y-1 text-sm text-gray-400"><li>No streetlights, unlit stretches</li><li>Broken inner lanes and potholes</li><li>Empty after 9 PM</li></ul>
            <div className="relative mt-8 h-24 rounded-xl bg-black/60">
              <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-gray-700" />
              <motion.div initial={{ left: "2%" }} whileInView={{ left: "78%" }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 2.2, delay: 0.5, ease: "easeInOut" }} className="absolute top-1/2 -translate-y-1/2 text-gray-500"><Car size={34} /></motion.div>
              <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.6 }} className="absolute right-3 top-2 rounded bg-red-500/90 px-2 py-0.5 text-xs font-bold text-white">⚑ FLAGGED</motion.span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.4 }} transition={SPRING}
            className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-card p-6">
            <div className="flex items-center gap-2 text-amber-400"><Moon size={18} /><b>Night-Safe Boulevard — +1 min</b></div>
            <ul className="mt-3 space-y-1 text-sm text-gray-400"><li>96% well-lit arterial road</li><li>Smooth asphalt, active shops</li><li>People around, help nearby</li></ul>
            <div className="relative mt-8 h-24 rounded-xl bg-black/60">
              {[10, 30, 50, 70, 90].map((l, i) => (
                <motion.span key={l} initial={{ opacity: 0, scale: 0.3 }} whileInView={{ opacity: 0.9, scale: 1 }} transition={{ delay: 0.4 + i * 0.25 }} className="absolute top-0 h-16 w-16 -translate-x-1/2 rounded-full" style={{ left: `${l}%`, background: "radial-gradient(rgba(245,158,11,.75), transparent 70%)" }} />
              ))}
              <div className="absolute inset-x-0 top-1/2 border-t-2 border-amber-500/50" />
              <motion.div initial={{ left: "2%" }} whileInView={{ left: "78%" }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 2.6, delay: 0.5, ease: "easeInOut" }} className="absolute top-1/2 -translate-y-1/2 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,.9)]"><Car size={34} /></motion.div>
            </div>
          </motion.div>
        </div>
        <div className="mt-10 text-center">
          <Link href="/app?demo=1" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-black transition hover:bg-amber-400">See it on a real map <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
}

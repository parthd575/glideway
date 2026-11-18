"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { ArrowDownUp, Link2, Loader2, MapPin, Play, TrafficCone, Lightbulb, Route as RouteIcon, Check } from "lucide-react";
import { MODES, ModeId, SPRING } from "@/lib/modes";
import { searchPlaces } from "@/lib/photon";
import type { Place, RouteResponse, ScoredRoute } from "@/lib/types";
import NightModeToggle from "./NightModeToggle";

function PlaceInput({ label, dot, value, onPick, bias }: { label: string; dot: string; value: Place | null; onPick: (p: Place | null) => void; bias?: { lat: number; lng: number } }) {
  const [q, setQ] = useState(value?.label ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abort = useRef<AbortController>(undefined);

  useEffect(() => { setQ(value?.label ?? ""); }, [value]);

  const onChange = (v: string) => {
    setQ(v);
    if (value) onPick(null);
    clearTimeout(timer.current);
    abort.current?.abort();
    if (v.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      abort.current = new AbortController();
      try { setResults(await searchPlaces(v, bias, abort.current.signal)); setOpen(true); } catch { /* aborted or offline */ }
    }, 250);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 focus-within:border-white/30">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />
        <input value={q} onChange={(e) => onChange(e.target.value)} onFocus={() => results.length && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder={label} aria-label={label} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500" />
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0f1523] shadow-2xl">
            {results.map((r, i) => (
              <li key={i}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(r); setOpen(false); }} className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-white/5">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-gray-500" />
                  <span className="min-w-0"><span className="block truncate text-sm">{r.label}</span><span className="block truncate text-xs text-gray-500">{r.sublabel}</span></span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

const fmtMin = (s: number) => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };

function RouteCard({ r, active, fastest, night, onSelect, index }: { r: ScoredRoute; active: boolean; fastest: ScoredRoute; night: boolean; onSelect: () => void; index: number }) {
  const m = MODES.find((x) => x.id === r.mode)!;
  const delta = Math.round((r.durationS - fastest.durationS) / 60);
  const pulse = night && r.mode === "night-safe";
  return (
    <motion.button
      layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: index * 0.06 }}
      onClick={onSelect} aria-pressed={active}
      className={`relative w-full rounded-2xl bg-card/80 p-3.5 text-left ${pulse && !active ? "amber-pulse" : ""}`}
      style={{ border: `1px solid ${active ? "transparent" : pulse ? "#F59E0B88" : "rgba(255,255,255,0.08)"}` }}
    >
      {active && <motion.span layoutId="activeRoutePill" transition={SPRING} className="absolute inset-0 rounded-2xl" style={{ border: `2px solid ${m.color}`, boxShadow: `0 0 24px ${m.color}55, inset 0 0 20px ${m.color}18` }} />}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} /><span className="font-semibold" style={{ color: m.color }}>{m.label}</span>{pulse && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">RECOMMENDED</span>}</div>
        <div className="text-right"><div className="text-lg font-bold leading-none">{fmtMin(r.durationS)}</div><div className="text-[11px] text-gray-500">{r.mode === "fastest" || delta <= 0 ? "fastest" : `+${delta} min`} · {(r.distanceM / 1000).toFixed(1)} km</div></div>
      </div>
      <div className="relative mt-2.5 grid grid-cols-3 gap-2 text-xs text-gray-300">
        <span className="flex items-center gap-1"><TrafficCone size={12} className="text-red-400" />{r.signals} signals</span>
        <span className="flex items-center gap-1"><RouteIcon size={12} className="text-blue-400" />{r.smoothPct}% smooth</span>
        <span className="flex items-center gap-1"><Lightbulb size={12} className="text-amber-400" />{r.litPct}% lit</span>
      </div>
      {r.sameAs && <div className="relative mt-2 text-[11px] text-gray-500">Best path here is the same as {MODES.find((x) => x.id === r.sameAs)!.label}.</div>}
    </motion.button>
  );
}

interface Props {
  from: Place | null; to: Place | null;
  setFrom: (p: Place | null) => void; setTo: (p: Place | null) => void;
  onDemo: () => void; onSwap: () => void;
  data: RouteResponse | null; loading: boolean; error: string | null;
  active: ModeId; setActive: (m: ModeId) => void;
  night: boolean; autoNight: boolean; setNight: (v: boolean) => void;
  isMobile: boolean;
}

export default function RouteSidebar(p: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [vh, setVh] = useState(800);
  const controls = useDragControls();
  const hasRoutes = !!p.data;
  // On phones, tuck the sheet down once routes arrive so the map is visible
  useEffect(() => { if (p.isMobile && hasRoutes) setExpanded(false); }, [p.isMobile, hasRoutes]);
  useEffect(() => { const f = () => setVh(window.innerHeight); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && p.isMobile) await navigator.share({ title: "GlideWay route", url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    } catch { /* user cancelled */ }
  };

  const routes = p.data?.routes;
  const fastest = routes?.find((r) => r.mode === "fastest");

  const body = (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">Glide<span className="text-emerald-400">Way</span></Link>
        <button onClick={share} disabled={!routes} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-300 transition hover:bg-white/10 disabled:opacity-40">{copied ? <Check size={13} className="text-emerald-400" /> : <Link2 size={13} />}{copied ? "Link copied" : "Share route"}</button>
      </div>

      <div className="relative space-y-2">
        <PlaceInput label="Starting point" dot="#34d399" value={p.from} onPick={p.setFrom} />
        <PlaceInput label="Destination" dot="#ef4444" value={p.to} onPick={p.setTo} bias={p.from ? { lat: p.from.lat, lng: p.from.lng } : undefined} />
        <button onClick={p.onSwap} aria-label="Swap" className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-[#0f1523] p-1.5 text-gray-400 hover:text-white"><ArrowDownUp size={13} /></button>
      </div>

      <button onClick={p.onDemo} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"><Play size={14} /> Try Demo Route (Ahmedabad: SG Highway → Airport)</button>

      <NightModeToggle night={p.night} auto={p.autoNight} onChange={p.setNight} />

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {p.loading && <div className="flex items-center gap-2 rounded-xl bg-white/5 p-4 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> Scoring routes with road data…</div>}
        {p.error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{p.error}</div>}
        {!p.loading && !routes && !p.error && <p className="px-1 text-sm text-gray-500">Pick two places, or hit the demo button to see how the four routes differ.</p>}
        {routes && fastest && (
          <>
            {p.data?.note && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200">{p.data.note}</div>}
            {routes.map((r, i) => <RouteCard key={r.mode} r={r} index={i} active={p.active === r.mode} fastest={fastest} night={p.night} onSelect={() => p.setActive(r.mode)} />)}
            <p className="px-1 text-[11px] text-gray-600">Lighting and smoothness use OpenStreetMap tags; where tags are missing they are estimated from road class.</p>
          </>
        )}
      </div>
    </div>
  );

  if (!p.isMobile) {
    return (
      <motion.aside key="desktop" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={SPRING} className="glass absolute bottom-4 left-4 top-4 z-20 w-[400px] overflow-hidden rounded-3xl shadow-2xl">
        {body}
      </motion.aside>
    );
  }

  const sheetH = Math.round(vh * 0.82);
  const collapsedY = sheetH - 250;
  return (
    <motion.aside
      key="mobile"
      drag="y" dragControls={controls} dragListener={false} dragConstraints={{ top: 0, bottom: collapsedY }} dragElastic={0.08} dragMomentum={false}
      initial={{ y: collapsedY }} animate={{ y: expanded ? 0 : collapsedY }} transition={SPRING}
      onDragEnd={(_, i) => setExpanded(i.offset.y < 0 || i.velocity.y < -300 ? true : i.offset.y > 60 || i.velocity.y > 300 ? false : expanded)}
      className="absolute inset-x-0 bottom-0 z-20 overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b1020]/95 shadow-2xl backdrop-blur-xl" style={{ height: sheetH, touchAction: "none" }}
    >
      <div onPointerDown={(e) => controls.start(e)} onClick={() => setExpanded((v) => !v)} className="flex cursor-grab justify-center pb-1 pt-2.5" style={{ touchAction: "none" }}><span className="h-1.5 w-10 rounded-full bg-white/25" /></div>
      <div style={{ height: sheetH - 22, touchAction: "pan-y" }}>{body}</div>
    </motion.aside>
  );
}

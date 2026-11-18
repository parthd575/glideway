"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useDragControls } from "framer-motion";
import { ArrowDownUp, Check, Download, Link2, Loader2, Navigation, Play, Plus } from "lucide-react";
import { MODE_BY_ID, ModeId, SPRING } from "@/lib/modes";
import { MAX_STOPS } from "@/lib/routing/limits";
import type { Place, RouteResponse } from "@/lib/types";
import type { ThemePref } from "@/hooks/useTheme";
import NightModeToggle from "./NightModeToggle";
import PlaceInput from "./PlaceInput";
import RouteCard from "./RouteCard";
import DirectionsList from "./DirectionsList";
import ThemeToggle from "./ThemeToggle";

interface Props {
  from: Place | null; to: Place | null; stops: (Place | null)[];
  setFrom: (p: Place | null) => void; setTo: (p: Place | null) => void; setStops: (s: (Place | null)[]) => void;
  onDemo: () => void; onSwap: () => void; onLocateFrom: () => Promise<void>;
  data: RouteResponse | null; loading: boolean; error: string | null; notice: string | null;
  active: ModeId; setActive: (m: ModeId) => void;
  night: boolean; autoNight: boolean; setNight: (v: boolean) => void;
  theme: ThemePref; setTheme: (t: ThemePref) => void;
  onStartNav: (simulate: boolean) => void;
  canInstall: boolean; onInstall: () => void;
  isMobile: boolean;
}

export default function RouteSidebar(p: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [vh, setVh] = useState(800);
  const [kb, setKb] = useState(0); // px covered by the on-screen keyboard (iOS overlays instead of resizing)
  const controls = useDragControls();
  const hasRoutes = !!p.data;
  // On phones, tuck the sheet down once routes arrive so the map is visible
  useEffect(() => { if (p.isMobile && hasRoutes) setExpanded(false); }, [p.isMobile, hasRoutes]);
  useEffect(() => {
    const f = () => { const v = window.visualViewport; setVh(v?.height ?? window.innerHeight); setKb(v ? Math.max(0, Math.round(window.innerHeight - v.height - v.offsetTop)) : 0); };
    f();
    window.addEventListener("resize", f); window.visualViewport?.addEventListener("resize", f);
    return () => { window.removeEventListener("resize", f); window.visualViewport?.removeEventListener("resize", f); };
  }, []);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && p.isMobile) await navigator.share({ title: "GlideWay route", url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    } catch { /* user cancelled */ }
  };

  const routes = p.data?.routes;
  const fastest = routes?.find((r) => r.mode === "fastest");
  const activeRoute = routes?.find((r) => r.mode === p.active);
  const canNavigate = !!activeRoute && (activeRoute.steps?.length ?? 0) > 1 && p.data?.source !== "sample";

  // Keep the suggestion list inside the area left above the on-screen keyboard
  const listMax = p.isMobile ? Math.max(120, Math.round(vh * 0.82) - 230) : 320;
  const setStop = (i: number, v: Place | null) => p.setStops(p.stops.map((s, j) => (j === i ? v : s)));
  const removeStop = (i: number) => p.setStops(p.stops.filter((_, j) => j !== i));

  const body = (
    <div onFocusCapture={() => { if (p.isMobile) setExpanded(true); }} className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="text-lg font-bold tracking-tight">Glide<span className="text-emerald-500">Way</span></Link>
        <div className="flex items-center gap-1.5">
          {p.canInstall && <button onClick={p.onInstall} aria-label="Install app" title="Install GlideWay" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-soft transition hover:bg-line"><Download size={14} /></button>}
          <ThemeToggle value={p.theme} onChange={p.setTheme} />
          <button onClick={share} disabled={!routes} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-soft transition hover:bg-line disabled:opacity-40">{copied ? <Check size={13} className="text-emerald-500" /> : <Link2 size={13} />}{copied ? "Copied" : "Share"}</button>
        </div>
      </div>

      <div className="space-y-2">
        <PlaceInput label="Starting point" dot="#34d399" value={p.from} onPick={p.setFrom} listMax={listMax} onLocate={p.onLocateFrom} />
        {p.stops.map((s, i) => (
          <PlaceInput key={i} label={`Stop ${i + 1}`} dot="#f59e0b" value={s} onPick={(v) => setStop(i, v)} onRemove={() => removeStop(i)} listMax={listMax} bias={p.from ? { lat: p.from.lat, lng: p.from.lng } : undefined} />
        ))}
        <PlaceInput label="Destination" dot="#ef4444" value={p.to} onPick={p.setTo} bias={p.from ? { lat: p.from.lat, lng: p.from.lng } : undefined} listMax={listMax} />
        <div className="flex items-center justify-between">
          <AddStop disabled={p.stops.length >= MAX_STOPS} onAdd={() => p.setStops([...p.stops, null])} count={p.stops.length} />
          <button onClick={p.onSwap} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-dim transition hover:bg-line hover:text-ink"><ArrowDownUp size={13} /> Swap</button>
        </div>
      </div>

      {!p.from && !p.to && <button onClick={p.onDemo} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"><Play size={14} /> Try demo route (Ahmedabad)</button>}

      <NightModeToggle night={p.night} auto={p.autoNight} onChange={p.setNight} />

      {canNavigate && (
        <div className="flex gap-2">
          <button onClick={() => p.onStartNav(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-black transition hover:brightness-110" style={{ background: MODE_BY_ID[p.active].color }}><Navigation size={16} /> Start navigation</button>
          <button onClick={() => p.onStartNav(true)} title="Preview the route with a simulated drive" className="flex items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-medium text-soft transition hover:bg-line"><Play size={13} /> Preview</button>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {p.notice && <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-300">{p.notice}</div>}
        {p.loading && <div className="flex items-center gap-2 rounded-xl bg-field p-4 text-sm text-dim"><Loader2 size={16} className="animate-spin" /> Scoring routes with road data…</div>}
        {p.error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{p.error}</div>}
        {!p.loading && !routes && !p.error && <p className="px-1 text-sm text-dim">Pick two places (or use your location), add up to {MAX_STOPS} stops, and compare four routes.</p>}
        {routes && fastest && (
          <>
            {p.data?.note && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-200">{p.data.note}</div>}
            {routes.map((r, i) => <RouteCard key={r.mode} r={r} index={i} active={p.active === r.mode} fastest={fastest} night={p.night} onSelect={() => p.setActive(r.mode)} />)}
            {activeRoute && <DirectionsList route={activeRoute} color={MODE_BY_ID[activeRoute.mode].color} />}
            <p className="px-1 text-[11px] text-dim">Lighting and smoothness use OpenStreetMap tags; where tags are missing they are estimated from road class.</p>
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
  const collapsedY = Math.max(0, sheetH - (canNavigate ? 400 : 250));
  return (
    <motion.aside
      key="mobile"
      drag="y" dragControls={controls} dragListener={false} dragConstraints={{ top: 0, bottom: collapsedY }} dragElastic={0.08} dragMomentum={false}
      initial={{ y: collapsedY }} animate={{ y: expanded ? 0 : collapsedY }} transition={SPRING}
      onDragEnd={(_, i) => setExpanded(i.offset.y < 0 || i.velocity.y < -300 ? true : i.offset.y > 60 || i.velocity.y > 300 ? false : expanded)}
      className="absolute inset-x-0 bottom-0 z-20 overflow-hidden rounded-t-3xl border border-line bg-panel/95 shadow-2xl backdrop-blur-xl" style={{ height: sheetH, bottom: kb, touchAction: "none" }}
    >
      <div onPointerDown={(e) => controls.start(e)} onClick={() => setExpanded((v) => !v)} className="flex cursor-grab justify-center pb-1 pt-2.5" style={{ touchAction: "none" }}><span className="h-1.5 w-10 rounded-full bg-dim/50" /></div>
      <div style={{ height: sheetH - 22, touchAction: "pan-y" }}>{body}</div>
    </motion.aside>
  );
}

function AddStop({ onAdd, disabled, count }: { onAdd: () => void; disabled: boolean; count: number }) {
  return (
    <button onClick={onAdd} disabled={disabled} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-emerald-500 transition hover:bg-emerald-500/10 disabled:opacity-40">
      <Plus size={13} /> Add stop{count > 0 ? ` (${count}/${MAX_STOPS})` : ""}
    </button>
  );
}

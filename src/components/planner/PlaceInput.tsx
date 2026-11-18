"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Briefcase, Clock, Crosshair, Home, Loader2, MapPin, Star, X } from "lucide-react";
import { searchPlaces } from "@/lib/photon";
import type { PlaceKind } from "@/lib/storage";
import type { Place } from "@/lib/types";

export interface QuickPick { place: Place; tag: "home" | "work" | "fav" | "recent"; name: string }
const TAG_ICON = { home: Home, work: Briefcase, fav: Star, recent: Clock } as const;

interface Props {
  label: string;
  dot: string;
  value: Place | null;
  onPick: (p: Place | null) => void;
  bias?: { lat: number; lng: number };
  listMax?: number;
  /** show a "use my location" button */
  onLocate?: () => Promise<void>;
  onRemove?: () => void;
  /** saved and recent places offered when the field is focused and empty */
  quick?: QuickPick[];
  /** lets the user save the chosen place */
  onSave?: (kind: PlaceKind, place: Place) => void;
}

export default function PlaceInput({ label, dot, value, onPick, bias, listMax, onLocate, onRemove, quick, onSave }: Props) {
  const [q, setQ] = useState(value?.label ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [locating, setLocating] = useState(false);
  const [focused, setFocused] = useState(false);
  const [saveMenu, setSaveMenu] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abort = useRef<AbortController>(undefined);

  useEffect(() => { setQ(value?.label ?? ""); }, [value]);

  const onChange = (v: string) => {
    setQ(v);
    if (value) onPick(null);
    clearTimeout(timer.current);
    abort.current?.abort();
    if (v.trim().length < 2) { setResults([]); setSearching(false); setSearched(false); setOpen(false); return; }
    setSearching(true); setSearched(false); setOpen(true);
    timer.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abort.current = ctrl;
      try { setResults(await searchPlaces(v, bias, ctrl.signal)); setSearched(true); } catch { /* aborted or offline */ }
      finally { if (!ctrl.signal.aborted) setSearching(false); }
    }, 250);
  };

  const locate = async () => {
    if (!onLocate || locating) return;
    setLocating(true);
    try { await onLocate(); } finally { setLocating(false); }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 rounded-xl border border-line bg-field px-3 py-2.5 focus-within:border-soft/50">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />
        <input
          value={q} onChange={(e) => onChange(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length || searching) setOpen(true); }} onBlur={() => { setTimeout(() => { setOpen(false); setFocused(false); }, 150); }}
          placeholder={label} aria-label={label} autoComplete="off"
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-dim"
        />
        {searching && <Loader2 size={14} className="shrink-0 animate-spin text-dim" aria-label="Searching" />}
        {onSave && value && Number.isFinite(value.lat) && (
          <div className="relative shrink-0">
            <button type="button" onClick={() => setSaveMenu((v) => !v)} aria-label="Save this place" aria-expanded={saveMenu} title="Save this place" className="rounded-md p-1 text-dim transition hover:bg-line hover:text-amber-500"><Bookmark size={15} /></button>
            {saveMenu && (
              <div className="absolute right-0 top-full z-40 mt-1 w-36 overflow-hidden rounded-xl border border-line bg-panel2 text-sm shadow-2xl">
                {([["home", "Home", Home], ["work", "Work", Briefcase], ["fav", "Favourite", Star]] as const).map(([k, l, I]) => (
                  <button key={k} onClick={() => { onSave(k, value); setSaveMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-line"><I size={14} className="text-dim" /> {l}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {onLocate && (
          <button type="button" onClick={locate} aria-label="Use my current location" title="Use my current location" className="shrink-0 rounded-md p-1 text-emerald-500 transition hover:bg-emerald-500/10">
            {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
          </button>
        )}
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="shrink-0 rounded-md p-1 text-dim transition hover:bg-line hover:text-ink"><X size={15} /></button>
        )}
      </div>
      <AnimatePresence>
        {focused && !open && !q.trim() && quick && quick.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute z-30 mt-1 w-full overflow-y-auto overscroll-contain rounded-xl border border-line bg-panel2 shadow-2xl"
            style={{ maxHeight: listMax, touchAction: "pan-y" }}
          >
            {quick.map((c, i) => {
              const I = TAG_ICON[c.tag];
              return (
                <li key={i}>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(c.place); setFocused(false); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-line">
                    <I size={14} className="shrink-0 text-dim" />
                    <span className="min-w-0"><span className="block truncate text-sm">{c.name}</span>{c.name !== c.place.label && <span className="block truncate text-xs text-dim">{c.place.label}</span>}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
        {open && (searching || searched || results.length > 0) && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute z-30 mt-1 w-full overflow-y-auto overscroll-contain rounded-xl border border-line bg-panel2 shadow-2xl"
            style={{ maxHeight: listMax, touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
          >
            {searching && results.length === 0 && <li className="flex items-center gap-2 px-3 py-3 text-sm text-dim"><Loader2 size={14} className="animate-spin" /> Searching places…</li>}
            {!searching && searched && results.length === 0 && <li className="px-3 py-3 text-sm text-dim">No places found in Gujarat.</li>}
            {results.map((r, i) => (
              <li key={i}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(r); setOpen(false); }} className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-line">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-dim" />
                  <span className="min-w-0"><span className="block truncate text-sm">{r.label}</span><span className="block truncate text-xs text-dim">{r.sublabel}</span></span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

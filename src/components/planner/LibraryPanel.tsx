"use client";

import { useState } from "react";
import { ArrowLeft, Briefcase, CheckCircle2, Clock, Home, Play, Star, Trash2 } from "lucide-react";
import { MODE_BY_ID } from "@/lib/modes";
import { fmtDuration } from "@/lib/directions";
import type { SavedPlace, Trip } from "@/lib/storage";
import type { Place } from "@/lib/types";

export interface LibraryApi {
  places: SavedPlace[]; trips: Trip[];
  onRemovePlace: (id: string) => void;
  onRemoveTrip: (id: string) => void;
  onClearTrips: () => void;
  onUseTrip: (t: Trip) => void;
  onUsePlace: (p: Place, as: "from" | "to") => void;
}

const KIND_ICON = { home: Home, work: Briefcase, fav: Star } as const;
const day = (ts: number) => new Date(ts).toLocaleDateString([], { day: "numeric", month: "short" }) + ", " + new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function LibraryPanel({ api, onBack }: { api: LibraryApi; onBack: () => void }) {
  const [tab, setTab] = useState<"saved" | "history">("saved");
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} aria-label="Back to route planner" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-soft hover:bg-line"><ArrowLeft size={15} /></button>
        <h2 className="text-base font-semibold">Saved &amp; history</h2>
      </div>
      <div role="tablist" className="grid grid-cols-2 gap-0.5 rounded-xl border border-line bg-field p-0.5 text-sm">
        {(["saved", "history"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-lg py-1.5 font-medium capitalize transition ${tab === t ? "bg-line text-ink" : "text-dim hover:text-ink"}`}>{t === "saved" ? `Saved (${api.places.length})` : `Trips (${api.trips.length})`}</button>
        ))}
      </div>

      <div data-sheet-scroll className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-0.5" style={{ touchAction: "pan-y" }}>
        {tab === "saved" && (api.places.length === 0
          ? <p className="px-1 py-6 text-center text-sm text-dim">No saved places yet. Pick a place, then tap the bookmark in its field to save it as Home, Work or a favourite.</p>
          : api.places.map((s) => {
            const I = KIND_ICON[s.kind];
            return (
              <div key={s.id} className="rounded-2xl border border-line bg-panel2 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-field text-amber-500"><I size={15} /></span>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{s.name}</div><div className="truncate text-xs text-dim">{s.place.sublabel || s.place.label}</div></div>
                  <button onClick={() => api.onRemovePlace(s.id)} aria-label={`Delete ${s.name}`} className="rounded-md p-1.5 text-dim hover:bg-line hover:text-red-500"><Trash2 size={14} /></button>
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <button onClick={() => api.onUsePlace(s.place, "from")} className="flex-1 rounded-lg border border-line py-1.5 text-soft hover:bg-line">Start here</button>
                  <button onClick={() => api.onUsePlace(s.place, "to")} className="flex-1 rounded-lg bg-emerald-500 py-1.5 font-semibold text-black hover:bg-emerald-400">Go here</button>
                </div>
              </div>
            );
          }))}

        {tab === "history" && (api.trips.length === 0
          ? <p className="px-1 py-6 text-center text-sm text-dim">No trips yet. Trips appear here when you start navigation.</p>
          : <>
            {api.trips.map((t) => (
              <div key={t.id} className="rounded-2xl border border-line bg-panel2 p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t.from.label} <span className="text-dim">→</span> {t.to.label}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-dim">
                      <span className="flex items-center gap-1"><Clock size={11} />{day(t.ts)}</span>
                      <span style={{ color: MODE_BY_ID[t.mode].color }}>{MODE_BY_ID[t.mode].label}</span>
                      <span>{(t.distanceM / 1000).toFixed(1)} km · {fmtDuration(t.durationS)}</span>
                      {t.stops.length > 0 && <span>{t.stops.length} stop{t.stops.length > 1 ? "s" : ""}</span>}
                      {t.simulated && <span className="rounded bg-field px-1">preview</span>}
                      {t.completed && <span className="flex items-center gap-0.5 text-emerald-500"><CheckCircle2 size={11} />arrived</span>}
                    </div>
                  </div>
                  <button onClick={() => api.onRemoveTrip(t.id)} aria-label="Delete trip" className="rounded-md p-1.5 text-dim hover:bg-line hover:text-red-500"><Trash2 size={14} /></button>
                </div>
                <button onClick={() => api.onUseTrip(t)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line py-1.5 text-xs font-medium text-soft hover:bg-line"><Play size={12} /> Plan this trip again</button>
              </div>
            ))}
            <button onClick={api.onClearTrips} className="w-full py-2 text-center text-xs text-dim underline-offset-2 hover:text-red-500 hover:underline">Clear trip history</button>
          </>)}
      </div>
      <p className="text-[11px] text-dim">Stored only in this browser. <a href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy</a></p>
    </div>
  );
}

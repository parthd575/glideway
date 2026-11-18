"use client";

import { useEffect, useRef } from "react";
import { LocateFixed } from "lucide-react";

export default function ConsentDialog({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onAnswer(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onAnswer]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-panel p-5 shadow-2xl">
        <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-emerald-500/15 text-emerald-500"><LocateFixed size={22} /></span>
        <h2 id="consent-title" className="text-lg font-bold">Use your location?</h2>
        <p className="mt-1.5 text-sm text-soft">GlideWay uses your position to set your start point and to guide you turn by turn. Your location is processed in your browser and is not stored on our servers or linked to you.</p>
        <p className="mt-2 text-xs text-dim">When you route, the start and end coordinates are sent to our routing service to calculate the trip. Your browser will ask for permission next. <a href="/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">Read the privacy notice</a>.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => onAnswer(false)} className="rounded-xl border border-line py-2.5 text-sm font-medium text-soft hover:bg-line">Not now</button>
          <button ref={ref} onClick={() => onAnswer(true)} className="rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400">Continue</button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Flag, Loader2, LocateOff, Volume2, VolumeX, X } from "lucide-react";
import ManeuverIcon from "@/components/ui/ManeuverIcon";
import { describeStep, fmtDistance, fmtDuration, stepIcon } from "@/lib/directions";
import type { NavProgress, PreparedRoute } from "@/lib/navigation";
import { limitAt } from "@/lib/navigation";
import LaneGuidance from "./LaneGuidance";
import type { GeoStatus } from "@/hooks/useGeolocation";
import { OFF_ROUTE_M } from "@/lib/navigation";

interface Props {
  prepared: PreparedRoute;
  progress: NavProgress | null;
  color: string;
  voice: boolean;
  onVoice: (v: boolean) => void;
  onEnd: () => void;
  rerouting: boolean;
  geoStatus: GeoStatus;
  simulate: boolean;
  speedMps: number | null;
}

export default function NavigationOverlay({ prepared, progress, color, voice, onVoice, onEnd, rerouting, geoStatus, simulate, speedMps }: Props) {
  const step = progress ? prepared.steps[progress.nextIndex] : prepared.steps[0];
  const after = progress ? prepared.steps[progress.nextIndex + 1] : undefined;
  const eta = progress ? new Date(Date.now() + progress.remainingS * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--";
  const off = !!progress && progress.offRouteM > OFF_ROUTE_M;
  const limit = progress ? limitAt(prepared, progress.progressM) : null;
  const kph = speedMps != null ? Math.round(speedMps * 3.6) : null;
  const over = !!limit && !limit.est && kph != null && kph > limit.kph + 3;
  const lanes = step?.lanes && progress && progress.distToNextM < 800 ? step.lanes : undefined;
  const noGps = !simulate && (geoStatus === "denied" || geoStatus === "unavailable");

  if (progress?.arrived) {
    return (
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute inset-x-3 bottom-4 z-30 mx-auto max-w-md rounded-3xl border border-line bg-panel p-5 text-center shadow-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-500"><Flag size={22} /></span>
        <div className="text-lg font-bold">You have arrived</div>
        <p className="mt-0.5 text-sm text-dim">Thanks for riding with GlideWay.</p>
        <button onClick={onEnd} className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black hover:bg-emerald-400">Done</button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute inset-x-3 top-3 z-30 mx-auto max-w-md pt-[env(safe-area-inset-top)]" role="status" aria-live="polite">
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
          <div className="flex items-center gap-4 p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-black" style={{ background: color }}>{step && <ManeuverIcon icon={stepIcon(step)} size={30} />}</span>
            <div className="min-w-0">
              <div className="text-2xl font-bold leading-none">{progress ? fmtDistance(progress.distToNextM) : "—"}</div>
              <div className="mt-1 text-sm text-soft">{step ? describeStep(step) : "Locating you…"}</div>
            </div>
          </div>
          {lanes && <LaneGuidance lanes={lanes} />}
          {after && after.type !== "arrive" && <div className="border-t border-line bg-field px-4 py-1.5 text-xs text-dim">Then: {describeStep(after)}</div>}
          {(rerouting || off || noGps || simulate || !progress) && (
            <div className="flex items-center gap-2 border-t border-line px-4 py-1.5 text-xs">
              {rerouting ? <><Loader2 size={13} className="animate-spin text-amber-500" /><span className="text-amber-500">Finding a new route…</span></>
                : noGps ? <><LocateOff size={13} className="text-red-400" /><span className="text-red-400">{geoStatus === "denied" ? "Location permission denied. Allow it to navigate." : "GPS unavailable."}</span></>
                : off ? <span className="text-amber-500">You&apos;re off the route</span>
                : !progress ? <><Loader2 size={13} className="animate-spin text-dim" /><span className="text-dim">Waiting for GPS signal…</span></>
                : <span className="text-dim">Simulated drive</span>}
            </div>
          )}
        </div>
      </motion.div>

      {(limit || kph != null) && (
        <div className="pointer-events-none absolute bottom-28 left-3 z-30 flex items-end gap-2 pb-[env(safe-area-inset-bottom)]">
          {limit && (
            <div title={limit.est ? "Typical limit for this road type (not posted)" : "Posted speed limit"} className="flex flex-col items-center">
              <div className={`grid h-14 w-14 place-items-center rounded-full bg-white text-xl font-extrabold text-black shadow-xl ${limit.est ? "border-[5px] border-dashed border-gray-400" : "border-[5px] border-red-600"}`}>{limit.kph}</div>
              {limit.est && <span className="mt-0.5 rounded bg-panel/90 px-1 text-[10px] font-medium text-dim">typical</span>}
            </div>
          )}
          {kph != null && <div className={`rounded-xl border px-3 py-1.5 text-center shadow-xl ${over ? "border-red-500 bg-red-600 text-white" : "border-line bg-panel text-ink"}`}><div className="text-xl font-bold leading-none">{kph}</div><div className="text-[10px] opacity-70">km/h</div></div>}
        </div>
      )}

      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute inset-x-3 bottom-4 z-30 mx-auto max-w-md pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 shadow-2xl">
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            <div><div className="text-lg font-bold leading-none">{eta}</div><div className="mt-1 text-[11px] text-dim">arrival</div></div>
            <div><div className="text-lg font-bold leading-none">{progress ? fmtDuration(progress.remainingS) : "--"}</div><div className="mt-1 text-[11px] text-dim">remaining</div></div>
            <div><div className="text-lg font-bold leading-none">{progress ? (progress.remainingM / 1000).toFixed(1) : "--"} <span className="text-xs font-medium">km</span></div><div className="mt-1 text-[11px] text-dim">distance</div></div>
          </div>
          <button onClick={() => onVoice(!voice)} aria-pressed={voice} aria-label={voice ? "Mute voice guidance" : "Unmute voice guidance"} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-field text-soft hover:text-ink">{voice ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
          <button onClick={onEnd} aria-label="End navigation" className="grid h-11 shrink-0 place-items-center gap-1 rounded-xl bg-red-500 px-3 text-sm font-semibold text-white hover:bg-red-400"><span className="flex items-center gap-1"><X size={16} /> End</span></button>
        </div>
      </motion.div>
    </>
  );
}

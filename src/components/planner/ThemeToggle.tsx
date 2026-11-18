"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemePref } from "@/hooks/useTheme";

const OPTS: { id: ThemePref; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "Auto", Icon: Monitor },
];

export default function ThemeToggle({ value, onChange, forcedDark }: { value: ThemePref; onChange: (v: ThemePref) => void; forcedDark: boolean }) {
  return (
    <div role="radiogroup" aria-label="Map theme" className="flex items-center gap-0.5 rounded-lg border border-line bg-field p-0.5" title={forcedDark ? "Night mode keeps the map dark" : "Map theme"}>
      {OPTS.map(({ id, label, Icon }) => (
        <button key={id} role="radio" aria-checked={value === id} onClick={() => onChange(id)} aria-label={label} className={`rounded-md p-1.5 transition ${value === id ? "bg-line text-ink" : "text-dim hover:text-ink"}`}><Icon size={13} /></button>
      ))}
    </div>
  );
}

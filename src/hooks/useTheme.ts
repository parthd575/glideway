"use client";

import { useCallback, useEffect, useState } from "react";

/** "auto" follows night mode: light by day, dark when night mode is on. */
export type ThemePref = "auto" | "light" | "dark";
const KEY = "glideway:theme";

export function useTheme(night: boolean) {
  const [pref, setPrefState] = useState<ThemePref>("auto");

  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v === "light" || v === "dark" || v === "auto") setPrefState(v); } catch { /* storage blocked */ }
  }, []);
  const setPref = useCallback((v: ThemePref) => {
    setPrefState(v);
    try { localStorage.setItem(KEY, v); } catch { /* storage blocked */ }
  }, []);

  const resolved: "light" | "dark" = pref === "auto" ? (night ? "dark" : "light") : pref;
  return { pref, setPref, resolved };
}

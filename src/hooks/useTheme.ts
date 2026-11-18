"use client";

import { useCallback, useEffect, useState } from "react";
import { useMediaQuery } from "./useMediaQuery";

export type ThemePref = "system" | "light" | "dark";
const KEY = "glideway:theme";

export function useTheme() {
  const [pref, setPrefState] = useState<ThemePref>("system");
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v === "light" || v === "dark" || v === "system") setPrefState(v); } catch { /* storage blocked */ }
  }, []);
  const setPref = useCallback((v: ThemePref) => {
    setPrefState(v);
    try { localStorage.setItem(KEY, v); } catch { /* storage blocked */ }
  }, []);

  const resolved: "light" | "dark" = pref === "system" ? (systemDark ? "dark" : "light") : pref;
  return { pref, setPref, resolved };
}

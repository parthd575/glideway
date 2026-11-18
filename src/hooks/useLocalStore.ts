"use client";

import { useCallback, useEffect, useState } from "react";
import { readStore, subscribeStore, writeStore } from "@/lib/storage";

/** A persisted value kept in sync across components and tabs. Starts as `initial` so server and client markup match. */
export function useLocalStore<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    const load = () => setValue(readStore<T>(key, initial));
    load();
    const unsub = subscribeStore(key, load);
    const onAll = (e: Event) => { if ((e as CustomEvent).detail === "*") load(); };
    window.addEventListener("glideway-storage", onAll);
    return () => { unsub(); window.removeEventListener("glideway-storage", onAll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((next: T | ((prev: T) => T)) => {
    const prev = readStore<T>(key, initial);
    writeStore(key, typeof next === "function" ? (next as (p: T) => T)(prev) : next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, set];
}

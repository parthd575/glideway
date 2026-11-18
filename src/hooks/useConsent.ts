"use client";

import { useCallback, useRef, useState } from "react";
import { useLocalStore } from "./useLocalStore";

interface Consent { location: boolean; ts: number }
const NONE: Consent = { location: false, ts: 0 };

/** Asks once, with a clear explanation, before the browser's own location prompt. */
export function useLocationConsent() {
  const [consent, setConsent] = useLocalStore<Consent>("consent", NONE);
  const [asking, setAsking] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ensure = useCallback((): Promise<boolean> => {
    if (consent.location) return Promise.resolve(true);
    setAsking(true);
    return new Promise((resolve) => { resolver.current = resolve; });
  }, [consent.location]);

  const answer = useCallback((ok: boolean) => {
    if (ok) setConsent({ location: true, ts: Date.now() });
    setAsking(false);
    resolver.current?.(ok);
    resolver.current = null;
  }, [setConsent]);

  return { granted: consent.location, asking, ensure, answer };
}

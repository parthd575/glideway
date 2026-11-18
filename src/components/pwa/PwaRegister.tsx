"use client";

import { useEffect } from "react";

/** Registers the service worker in production only, so dev hot-reload isn't served from a stale cache. */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => { /* unsupported or blocked */ });
    if (document.readyState === "complete") onLoad(); else window.addEventListener("load", onLoad, { once: true });
  }, []);
  return null;
}

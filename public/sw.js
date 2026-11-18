/* GlideWay service worker: offline app shell, cached map data, and last-known routes. */
const VERSION = "v1";
const SHELL = `glideway-shell-${VERSION}`;
const MAP = `glideway-map-${VERSION}`;
const ROUTES = `glideway-routes-${VERSION}`;
const MAP_LIMIT = 400;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(["/offline.html", "/icons/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL, MAP, ROUTES]);
    for (const k of await caches.keys()) if (k.startsWith("glideway-") && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

const networkFirst = async (req, cacheName, fallback) => {
  const c = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch {
    return (await c.match(req)) || (fallback ? fallback() : Response.error());
  }
};

const staleWhileRevalidate = async (req, cacheName, limit) => {
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") { c.put(req, res.clone()); if (limit) trim(cacheName, limit); } return res; }).catch(() => hit);
  return hit || net;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Basemap style, tiles, glyphs and sprites: serve from cache, refresh in background
  if (url.hostname.endsWith("cartocdn.com")) { e.respondWith(staleWhileRevalidate(req, MAP, MAP_LIMIT)); return; }
  if (url.origin !== location.origin) return;

  // Routes: network first so results are fresh, cached copy keeps the last trip usable offline
  if (url.pathname === "/api/route") { e.respondWith(networkFirst(req, ROUTES)); return; }
  if (url.pathname.startsWith("/api/")) return;

  // Pages: network first, fall back to cache, then the offline page
  if (req.mode === "navigate") {
    e.respondWith(networkFirst(req, SHELL, async () => (await caches.match("/offline.html")) || Response.error()));
    return;
  }

  // Next.js static assets are content-hashed, so cache-first is safe
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/maplibre/")) {
    e.respondWith(caches.open(SHELL).then(async (c) => (await c.match(req)) || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; })));
  }
});

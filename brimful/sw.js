// Brimful service worker: makes the app open offline. Pages are fetched fresh when online; assets are cached.
const VERSION = "brimful-v6";
const CORE = ["/app", "/assets/css/base.css", "/assets/css/app.css", "/assets/js/theme.js", "/assets/js/app.js", "/assets/js/views.js", "/assets/js/share.js",
  "/assets/js/lib/store.js", "/assets/js/lib/money.js", "/assets/js/lib/challenges.js", "/assets/js/lib/fx.js", "/assets/js/lib/api.js", "/assets/js/lib/cloud.js", "/assets/js/lib/together.js", "/assets/js/together.js", "/assets/js/install.js", "/assets/js/lib/jar3d.js", "/assets/js/lib/styles.js",
  "/assets/vendor/gsap.min.js", "/assets/vendor/three.bundle.js", "/assets/img/icon.svg",
  "/assets/fonts/bricolage-grotesque-latin-wght-normal.woff2", "/assets/fonts/instrument-sans-latin-wght-normal.woff2", "/assets/fonts/jetbrains-mono-latin-wght-normal.woff2"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // payments API and anything else: straight to the network
  if (req.mode === "navigate") { e.respondWith(fetch(req).then((r) => { if (r.ok && url.pathname === "/app") { const copy = r.clone(); caches.open(VERSION).then((c) => c.put("/app", copy)); } return r; }).catch(() => caches.match(url.pathname === "/app" ? "/app" : req).then((r) => r ?? caches.match("/app")))); return; }
  // stale-while-revalidate for assets
  e.respondWith(caches.match(req).then((hit) => { const net = fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return r; }).catch(() => hit); return hit ?? net; }));
});

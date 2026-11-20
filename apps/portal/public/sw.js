/*
 * Eco Nojin portal service worker.
 *
 * Strategy:
 *  - navigations: network-first, falling back to the cached shell when offline;
 *  - same-origin static assets: stale-while-revalidate;
 *  - everything else (API, third-party): never cached.
 *
 * API responses are deliberately excluded: caching a payment or identity
 * response would be a correctness bug, not an optimisation.
 */
const VERSION = "eco-portal-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

// The portal may be served at the origin root or under a prefix (/portal/) by the
// unified host. Everything is derived from the registration scope, so the shell
// cache can never capture another app's page.
const BASE = new URL("./", self.registration.scope).pathname.replace(/\/+$/u, "");
const SHELL = `${BASE}/`;
const SHELL_URLS = [SHELL, `${BASE}/manifest.webmanifest`, `${BASE}/icon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheable(request) {
  const url = new URL(request.url);
  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith(`${BASE}/api/`)) return false;
  return /\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?|ico|json|webmanifest)$/u.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(SHELL, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match(SHELL).then((cached) => cached ?? Response.error())),
    );
    return;
  }

  if (!isCacheable(request)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    }),
  );
});
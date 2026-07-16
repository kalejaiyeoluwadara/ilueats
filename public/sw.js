/**
 * Cache strategy is split by how an asset relates to a build:
 *
 *   - /_next/static/*  content-hashed, immutable -> cache-first, kept forever.
 *   - documents + RSC  name the current build's chunks -> network-first, so a
 *                      redeploy can never leave us serving HTML that points at
 *                      chunk hashes the new deploy deleted (ChunkLoadError).
 *   - /public assets   stable names, cosmetic -> stale-while-revalidate.
 *
 * Bump CACHE_VERSION to evict everything a previous strategy poisoned.
 */
const CACHE_VERSION = "v2";
const STATIC_CACHE = `ilueats-static-${CACHE_VERSION}`;
const DOCUMENT_CACHE = `ilueats-documents-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

/** Deliberately excludes "/": a cached document outlives the build it names. */
const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  "/favicon.ico",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/icon-maskable.svg",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, DOCUMENT_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.map((name) => (keep.has(name) ? undefined : caches.delete(name)))
        )
      )
      .then(() => self.clients.claim())
  );
});

/** Next prefetches RSC payloads with ?_rsc=<buildHash> or an RSC request header. */
function isDocumentRequest(request, url) {
  return (
    request.mode === "navigate" ||
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("accept")?.includes("text/x-component")
  );
}

function isCacheable(response) {
  return response && response.status === 200 && response.type === "basic";
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network wins whenever it answers. The cached copy exists only so a genuinely
 * offline visitor sees the last page they opened instead of a browser error.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const cache = await caches.open(DOCUMENT_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return caches.match(OFFLINE_URL);
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const network = fetch(request)
    .then((response) => {
      if (isCacheable(response)) {
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => undefined);

  return cached ?? (await network) ?? fetch(request);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/rider")
  ) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isDocumentRequest(request, url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

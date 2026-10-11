/* LifeOS service worker. Generated into dist/sw.js at build time (see vite.config.js).
 *
 * The page itself is always asked from the network first, so an online visitor gets the
 * newest deploy; the cached copy only answers when the network is unreachable or too slow.
 * Files under /assets/ carry a content hash in their name and never change, so they are
 * served from the cache.
 *
 * Kill switch: deploy a sw.js whose install handler calls self.skipWaiting() and whose
 * activate handler deletes every cache and calls self.registration.unregister().
 */
const BUILD = '__BUILD_ID__';
const APP_VERSION = '__APP_VERSION__';
const CACHE = `lifeos-${BUILD}`;
const PRECACHE = __PRECACHE__;
const SHELL = '/';
const PAGE_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('lifeos-') && name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

// The page: network first, falling back to the saved copy when offline or when the network
// takes too long. The request is passed to fetch() untouched — it is a navigation, and
// browsers are strict about how those may be re-issued.
async function page(event) {
  const { request } = event;
  const cache = await caches.open(CACHE);
  const network = fetch(request).then((response) => {
    // A redirect comes back as an opaque, non-ok response and is left for the browser to follow.
    if (response.ok) cache.put(SHELL, response.clone()).catch(() => {});
    return response;
  });
  const tooSlow = new Promise((resolve) => { setTimeout(resolve, PAGE_TIMEOUT_MS, null); });
  try {
    const first = await Promise.race([network, tooSlow]);
    const saved = await cache.match(SHELL);
    if (first) {
      // A server error page is worse than the working copy this device already has.
      const usable = first.ok || first.type === 'opaqueredirect';
      return usable || !saved ? first : saved;
    }
    if (saved) {
      // Let the request finish in the background so the saved copy is refreshed when it arrives.
      event.waitUntil(network.then(() => {}, () => {}));
      return saved;
    }
    return await network;
  } catch {
    const saved = await cache.match(SHELL);
    if (saved) return saved;
    return new Response('LifeOS no pudo cargar y todavía no hay una copia guardada en este dispositivo.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function immutable(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function refreshing(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const fresh = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  if (cached) {
    fresh.catch(() => {});
    return cached;
  }
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') event.respondWith(page(event));
  else if (url.pathname.startsWith('/assets/')) event.respondWith(immutable(request));
  else event.respondWith(refreshing(request));
});

// The page asks which version this worker belongs to, to tell a real update from the worker
// simply taking control of a page that is already current.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'lifeos:version' && event.ports[0]) event.ports[0].postMessage(APP_VERSION);
});

// Reminders are shown through the worker because phones only allow notifications that way.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (windows.length) return windows[0].focus();
    return self.clients.openWindow(SHELL);
  })());
});

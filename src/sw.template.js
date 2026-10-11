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

async function page(request) {
  const cache = await caches.open(CACHE);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (response.ok) await cache.put(SHELL, response.clone());
    return response;
  } catch {
    const cached = await cache.match(SHELL);
    if (cached) return cached;
    return new Response('LifeOS no pudo cargar y todavía no hay una copia guardada en este dispositivo.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } finally {
    clearTimeout(timer);
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
  if (request.mode === 'navigate') event.respondWith(page(request));
  else if (url.pathname.startsWith('/assets/')) event.respondWith(immutable(request));
  else event.respondWith(refreshing(request));
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

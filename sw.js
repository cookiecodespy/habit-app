const CACHE_NAME = 'habit-app-v2-openclaw-polish';
const APP_SHELL = [
  './',
  './index.html',
  './lo-data.js',
  './lo-ai.js',
  './lo-screens-1.jsx',
  './lo-screens-2.jsx',
  './lo-screens-3.jsx',
  './lo-screens-4.jsx',
  './lo-polish.js',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) =>
      response || fetch(event.request).then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return networkResponse;
      }).catch(() => caches.match('./index.html'))
    )
  );
});

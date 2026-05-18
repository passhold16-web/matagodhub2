const CACHE_NAME = 'matagodhub-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

const shouldCache = (request, response) => {
  if (!response || response.status !== 200) return false;
  const url = new URL(request.url);
  // Never cache API / Supabase / cross-origin requests
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/api/')) return false;
  return true;
};

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => Promise.resolve());
    })
  );
  self.skipWaiting();
});

// Activate event — drop old caches (e.g. v1 that cached Supabase responses)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache only same-origin static assets; network-first for everything else
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isAppShell =
    url.origin === self.location.origin &&
    (url.pathname === '/' ||
      url.pathname === '/index.html' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.webmanifest'));

  if (!isAppShell) {
    // Supabase, analytics, etc. — always hit the network
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((fetchResponse) => {
        if (shouldCache(event.request, fetchResponse)) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      })
      .catch(() => caches.match('/index.html'))
  );
});

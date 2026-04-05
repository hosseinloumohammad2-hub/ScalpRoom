const CACHE_NAME = 'fxscalproom-v3';

const SKIP_DOMAINS = [
  'tradingview.com',
  'tgju.org',
  'bonbast.amirhn.com',
  'flagofiran.com',
  'navasan.tech',
  'accessban.com'
];

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip external APIs and widgets entirely
  if (SKIP_DOMAINS.some(d => url.hostname.includes(d))) return;

  // Supabase API — network only, cache fallback
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)); return r; })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // CDN (React, Babel, fonts) — cache first (these never change)
  if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)); } return r; });
      })
    );
    return;
  }

  // Own origin (index.html etc) — NETWORK FIRST so updates apply immediately
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)); return r; })
        .catch(() => caches.match(event.request).then(c => c || (event.request.mode === 'navigate' ? caches.match('/') : undefined)))
    );
    return;
  }
});

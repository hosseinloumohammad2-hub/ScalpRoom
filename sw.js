const CACHE_NAME = 'fxscalproom-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html'
];

// Domains that should NEVER be intercepted — let browser handle them
const SKIP_DOMAINS = [
  'tradingview.com',
  'tgju.org',
  'bonbast.amirhn.com',
  'flagofiran.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
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

  // Skip external widgets — don't touch them at all
  if (SKIP_DOMAINS.some(d => url.hostname.includes(d))) return;

  // Supabase API — network first, cache fallback
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)); return r; })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // CDN (React, Babel, fonts) — cache first
  if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)); } return r; });
      })
    );
    return;
  }

  // Own origin — cache first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)); } return r; })
          .catch(() => event.request.mode === 'navigate' ? caches.match('/index.html') : undefined);
      })
    );
    return;
  }
});

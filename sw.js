const CACHE_NAME = 'fxscalproom-v4';

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

/* ─── Real Push Notifications ─── */
self.addEventListener('push', event => {
  let data = { title: 'Fxscalproom', body: 'New update!' };
  try { if (event.data) data = event.data.json(); } catch (e) { try { data.body = event.data.text(); } catch (e2) {} }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Fxscalproom', {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'fx-' + Date.now(),
      renotify: true,
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus(); }
      return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});

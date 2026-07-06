const CACHE_NAME = 'fxscalproom-v8';
const IMG_CACHE = 'fxscalproom-img-v8';
const IMG_MAX = 150; // cap cached images so storage doesn't grow forever

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
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== IMG_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Trim a cache to a max number of entries (oldest first).
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip external APIs and widgets entirely
  if (SKIP_DOMAINS.some(d => url.hostname.includes(d))) return;

  // Supabase STORAGE (images) — cache first, images never change once uploaded
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) {
    event.respondWith(
      caches.open(IMG_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const r = await fetch(event.request);
        if (r.ok) { cache.put(event.request, r.clone()); trim(IMG_CACHE, IMG_MAX); }
        return r;
      })
    );
    return;
  }

  // Supabase API — network only, cache fallback (fresh data)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)); return r; })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Local academy chart images — cache first (static, never change)
  if (url.origin === self.location.origin && /\/charts\/academy_.*\.webp$/.test(url.pathname)) {
    event.respondWith(
      caches.open(IMG_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const r = await fetch(event.request);
        if (r.ok) { cache.put(event.request, r.clone()); trim(IMG_CACHE, IMG_MAX); }
        return r;
      })
    );
    return;
  }

  // CDN (React, fonts) — cache first (these never change)
  if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)); } return r; });
      })
    );
    return;
  }

  // Own origin (index.html / /app etc) — STALE-WHILE-REVALIDATE:
  // show cached copy instantly, refresh in the background so the next load is up to date.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        const network = fetch(event.request)
          .then(r => { if (r.ok) cache.put(event.request, r.clone()); return r; })
          .catch(() => cached || (event.request.mode === 'navigate' ? cache.match('/app') : undefined));
        return cached || network;
      })
    );
    return;
  }
});

/* ─── Real Push Notifications (unchanged) ─── */
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

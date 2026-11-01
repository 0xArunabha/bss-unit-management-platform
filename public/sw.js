const CACHE = 'light-of-science-workspace-v4';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        '/',
        '/offline',
        '/images/bss-logo.svg',
        '/images/app-icon-192.png'
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  // Stale-while-revalidate for static assets, network-first with offline fallback for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || (await caches.match('/offline'));
      })
    );
  }
});

// PWA Background Sync for Offline Field Queues
self.addEventListener('sync', (event) => {
  if (event.tag === 'bss-sync-queue') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'BSS_TRIGGER_SYNC' });
        }
      })
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Light of Science · Jalpaiguri Unit',
    body: 'A new update from your science community is available.',
    url: '/',
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* Show a safe fallback for a malformed payload. */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/images/app-icon-192.png',
      badge: '/images/app-icon-192.png',
      data: { url: payload.url || '/' },
      tag: 'bss-unit-update',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          await client.navigate(target.href);
          return client.focus();
        }
      }
      return self.clients.openWindow(target.href);
    })
  );
});

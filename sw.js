const CACHE_NAME = 'gold-app-v3';

// ملحوظة: الموقع كله في ملف index.html واحد (مفيش style.css أو app.js منفصلين)
// كانت الكاش القديمة بتحاول تجيب ملفات مش موجودة، وده كان بيفشّل تسجيل الـ Service Worker بصمت
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-16.png',
  '/icons/icon-32.png',
  '/icons/icon-48.png',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-mask-192.png',
  '/icons/icon-mask-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.warn('SW cache install failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // لا تكاش طلبات الـ API (لازم تفضل لايف دايمًا) ولا طلبات المتصفحات الخارجية (TradingView, flagcdn..)
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ====== الضغط على إشعار تنبيه سعر: يفتح التطبيق (أو يركّز عليه لو مفتوح أصلاً) ======
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate ? client.navigate(targetUrl) : null;
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// Service Worker حقيقي — بيستقبل إشعارات Push من السيرفر حتى لو التطبيق مقفول تمامًا
// (المتصفح/نظام التشغيل هو اللي بيشغّله وقت وصول push event، مش الـ tab)

const OFFLINE_CACHE = "offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// أي محاولة فتح صفحة (تنقل بين التابات أو أول فتح للتطبيق) لو فشلت لعدم وجود
// نت، بنرجّع صفحة الأوفلاين المخصصة بدل ما المتصفح يعرض شاشته الافتراضية.
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "تحديث الأسعار", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "تحديث الأسعار";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-monochrome.png",
    tag: payload.tag || "price-update",
    renotify: true,
    dir: "rtl",
    lang: "ar",
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});

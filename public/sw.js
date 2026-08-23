// Service Worker حقيقي — بيستقبل إشعارات Push من السيرفر حتى لو التطبيق مقفول تمامًا
// (المتصفح/نظام التشغيل هو اللي بيشغّله وقت وصول push event، مش الـ tab)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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

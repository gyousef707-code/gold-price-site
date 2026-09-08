// Service Worker حقيقي — بيستقبل إشعارات Push من السيرفر حتى لو التطبيق مقفول تمامًا
// (المتصفح/نظام التشغيل هو اللي بيشغّله وقت وصول push event، مش الـ tab)

const OFFLINE_CACHE = "offline-v2";

// محتوى صفحة الأوفلاين مكتوب هنا كامل جوه السيرفس ووركر نفسه (مش ملف
// منفصل) عشان نضمن إنه شغال دايمًا حتى لو فيه أي مشكلة في تحميل الملفات
// الثابتة من السيرفر.
const OFFLINE_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>ذهبي - لا يوجد اتصال</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background: #0d1117;
    color: #f0f6fc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif;
  }
  .wrap {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
  }
  .logo { width: 96px; height: 96px; margin-bottom: 26px; }
  .cloud { font-size: 34px; margin-bottom: 14px; color: #8b949e; }
  h1 { font-size: 19px; font-weight: 800; margin: 0 0 8px; color: #f0f6fc; }
  p {
    font-size: 13.5px;
    color: #8b949e;
    margin: 0 0 26px;
    line-height: 1.7;
    max-width: 280px;
  }
  button {
    background: linear-gradient(145deg, #e3b341, #c99a2e);
    color: #0d1117;
    border: none;
    border-radius: 999px;
    padding: 13px 34px;
    font-size: 14.5px;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
  }
  button:active { opacity: 0.85; }
</style>
</head>
<body>
  <div class="wrap">
    <svg class="logo" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e3b341"/>
          <stop offset="50%" stop-color="#f0c040"/>
          <stop offset="100%" stop-color="#b8860b"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#sg)"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="#0d1117" stroke-width="2"/>
      <text x="50" y="60" font-size="26" text-anchor="middle" fill="#0d1117" font-family="Cairo, serif" font-weight="800">ذهبي</text>
    </svg>
    <div class="cloud">☁︎</div>
    <h1>لا يوجد اتصال بالإنترنت</h1>
    <p>تأكد من اتصالك بالإنترنت وحاول مرة أخرى لمتابعة أسعار الذهب والفضة والعملات لحظة بلحظة.</p>
    <button onclick="location.reload()">حاول مرة أخرى</button>
  </div>
</body>
</html>`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== OFFLINE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// أي محاولة فتح صفحة (تنقل بين التابات أو أول فتح للتطبيق) لو فشلت لعدم وجود
// نت، بنرجّع صفحة الأوفلاين المخصصة (مكتوبة هنا فوق مباشرة) بدل ما المتصفح
// يعرض شاشته الافتراضية.
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }),
      ),
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

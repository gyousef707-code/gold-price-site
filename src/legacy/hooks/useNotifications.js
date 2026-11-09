import { useEffect, useState } from 'react';

const KEY = 'app-notifications';
const SNAP = 'app-price-snapshot';
const MAX = 40;

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || '') ?? fallback;
  } catch {
    return fallback;
  }
}

function push(list, item) {
  const next = [item, ...list].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

// -------- Push حقيقي (Service Worker + اشتراك مخزّن على السيرفر) --------
// ده اللي بيخلي الإشعار يوصل حتى لو التطبيق مقفول تمامًا على الموبايل،
// لأن السيرفر (مش المتصفح) هو اللي بيبعت الإشعار عن طريق الـ push service بتاع النظام.

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

export async function subscribeToPush() {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'الصفحة لسه بتحمّل، جرّب تاني.' };
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'المتصفح ده مش بيدعم الإشعارات الحقيقية (Push). جرّب Chrome محدّث.' };
  }

  if (Notification.permission === 'denied') {
    return {
      ok: false,
      reason: 'لازم تفتح الإشعارات الأول: دوس على القفل جنب الرابط ← الأذونات ← الإشعارات ← سماح، وبعدين دوس تفعيل التنبيه تاني.',
    };
  }

  let permission;
  try {
    permission = await withTimeout(Notification.requestPermission(), 30000, 'طلب الإذن ما اتجاوبش في 30 ثانية');
  } catch (e) {
    return { ok: false, reason: `فشل طلب الإذن: ${e?.message || e}` };
  }
  if (permission !== 'granted') {
    return {
      ok: false,
      reason:
        permission === 'denied'
          ? 'لازم تفتح الإشعارات الأول: دوس على القفل جنب الرابط ← الأذونات ← الإشعارات ← سماح، وبعدين دوس تفعيل التنبيه تاني.'
          : 'لازم تفعّل الإشعارات الأول: اضغط سماح لما يظهر الطلب. ولو ما ظهرش، افتح الموقع من Chrome نفسه (مش من تطبيق تاني) ومن القفل جنب الرابط ← الأذونات ← الإشعارات ← سماح.',
    };
  }

  let reg;
  try {
    reg = await navigator.serviceWorker.register('/sw.js');
    await withTimeout(navigator.serviceWorker.ready, 10000, 'الـ Service Worker ما جهزش في 10 ثواني. اقفل التبويب وافتحه تاني وجرّب');
  } catch (e) {
    return { ok: false, reason: `فشل تسجيل Service Worker: ${e?.message || e}` };
  }

  let vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    // لو المتغير مش موجود في الـ build نجيب المفتاح العام من السيرفر
    try {
      const r = await fetch('/api/push/vapid-key');
      if (r.ok) vapidKey = (await r.json())?.key || '';
    } catch {
      /* نكمل لرسالة الخطأ تحت */
    }
  }
  if (!vapidKey) {
    return { ok: false, reason: 'السيرفر مش مظبوط لسه (متغير VITE_VAPID_PUBLIC_KEY مش موجود في الـ build).' };
  }

  let sub;
  try {
    sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }),
        15000,
        'خدمة الإشعارات (Google) ما ردّتش في 15 ثانية. اتأكد من النت أو جرّب شبكة تانية',
      );
    }
  } catch (e) {
    return { ok: false, reason: `فشل الاشتراك في الـ Push: ${e?.message || e}` };
  }

  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      return { ok: false, reason: `السيرفر رفض حفظ الاشتراك (كود ${res.status}). ${bodyText.slice(0, 200)}` };
    }
  } catch (e) {
    return { ok: false, reason: `تعذّر الاتصال بالسيرفر لحفظ الاشتراك: ${e?.message || e}` };
  }

  try {
    localStorage.removeItem('push-opt-out');
  } catch {
    /* تجاهل */
  }
  return { ok: true };
}

function pct(a, b) {
  if (!a || !b) return 0;
  return ((b - a) / a) * 100;
}

// نغمة قصيرة (نوتتين) بتتشغل جوه الصفحة لما تنبيه سعر يوصل والموقع مفتوح
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1318.5].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.2;
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close && ctx.close(), 1500);
  } catch {
    /* تجاهل */
  }
}

// بيقارن الأسعار الحالية بآخر نسخة محفوظة وبيولّد إشعارات حقيقية بوقتها
export default function useNotifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setItems(read(KEY, []));

    // متصفحات الموبايل بترفض بصمت أي طلب إذن إشعارات لو حصل من غير "لمسة
    // حقيقية" من المستخدم (تدبير أمان من المتصفح نفسه، مش من كودنا).
    // فبدل ما نطلب الإذن فورًا وقت فتح الصفحة، بنستنى أول لمسة/كليك حقيقي
    // في أي حتة في الصفحة (سكرول، دوسة عادية...) ووقتها بس نطلب الإذن —
    // كده التجربة تفضل تلقائية بالكامل من غير أي زرار إضافي في الشكل.
    let done = false;
    const trySubscribe = () => {
      if (done) return;
      done = true;
      window.removeEventListener('pointerdown', trySubscribe);
      window.removeEventListener('keydown', trySubscribe);
      try {
        // المستخدم قفل التنبيهات بنفسه من كارت الإشعارات: ما نشتركوش تاني من غير ما يفعّلها
        if (localStorage.getItem('push-opt-out') === '1') return;
      } catch {
        /* تجاهل */
      }
      subscribeToPush();
    };
    window.addEventListener('pointerdown', trySubscribe, { once: true });
    window.addEventListener('keydown', trySubscribe, { once: true });

    const onSwMessage = (e) => {
      if (e.data && e.data.type === 'alert-chime') playChime();
    };
    if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', onSwMessage);

    async function tick() {
      try {
        const [gold, currency, crypto] = await Promise.all([
          fetch('/api/public/gold-price').then((r) => r.json()).catch(() => null),
          fetch('/api/public/currency-price').then((r) => r.json()).catch(() => null),
          fetch('/api/public/crypto-price').then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;

        const prev = read(SNAP, {});
        const now = {
          ounce: Number(gold?.ounce_usd) || null,
          k21: gold?.caratPrices?.['21']?.sell || null,
          pound: gold?.pound?.sell || null,
          usd: currency?.rates?.usd?.sell || null,
          btc: crypto?.coins?.find((c) => c.id === 'bitcoin')?.price_usd || null,
        };

        let list = read(KEY, []);
        const at = Date.now();
        // ملاحظة: بس بتحدّث قائمة الإشعارات جوه التطبيق (الصفحة). الإشعار الحقيقي
        // (اللي بيوصل حتى لو التطبيق مقفول) بيتبعت من السيرفر عن طريق /api/push/check
        const add = (type, title, body) => {
          list = push(list, { id: `${type}-${at}`, type, title, body, at });
        };

        if (prev.k21 && now.k21 && prev.k21 !== now.k21) {
          const d = now.k21 - prev.k21;
          add(
            'gold',
            d > 0 ? 'ارتفاع سعر عيار 21' : 'انخفاض سعر عيار 21',
            `${prev.k21.toLocaleString('en-US')} ← ${now.k21.toLocaleString('en-US')} ج.م (${d > 0 ? '+' : ''}${d.toFixed(0)})`
          );
        }
        if (prev.ounce && now.ounce && Math.abs(pct(prev.ounce, now.ounce)) >= 0.05) {
          const p = pct(prev.ounce, now.ounce);
          add(
            'ounce',
            p > 0 ? 'ارتفاع الأونصة العالمية' : 'انخفاض الأونصة العالمية',
            `$${now.ounce.toLocaleString('en-US', { maximumFractionDigits: 2 })} (${p > 0 ? '+' : ''}${p.toFixed(2)}%)`
          );
        }
        if (prev.usd && now.usd && prev.usd !== now.usd) {
          add('usd', 'تغيّر سعر الدولار', `${now.usd.toFixed(2)} ج.م للبيع`);
        }
        if (prev.btc && now.btc && Math.abs(pct(prev.btc, now.btc)) >= 0.3) {
          const p = pct(prev.btc, now.btc);
          add(
            'crypto',
            p > 0 ? 'ارتفاع البيتكوين' : 'انخفاض البيتكوين',
            `$${now.btc.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${p > 0 ? '+' : ''}${p.toFixed(2)}%)`
          );
        }

        if (!list.length) {
          if (now.k21) {
            list = push(list, {
              id: `welcome-${at}`,
              type: 'gold',
              title: 'أسعار اليوم متاحة',
              body: `عيار 21 الآن ${now.k21.toLocaleString('en-US')} ج.م — الجنيه ذهب ${now.pound ? now.pound.toLocaleString('en-US') : '—'} ج.م`,
              at,
            });
          }
        }

        localStorage.setItem(SNAP, JSON.stringify(now));
        setItems(list);
      } catch {
        /* تجاهل */
      }
    }

    tick();
    const id = setInterval(tick, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('pointerdown', trySubscribe);
      window.removeEventListener('keydown', trySubscribe);
      if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('message', onSwMessage);
    };
  }, []);

  const clear = () => {
    localStorage.removeItem(KEY);
    setItems([]);
  };

  return { items, clear };
}

export function relativeTime(ts, lang = 'ar') {
  const diff = Math.round((Date.now() - ts) / 1000);
  const en = lang === 'en';
  if (diff < 60) return en ? 'just now' : 'الآن';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return en ? `${m} min ago` : `منذ ${m} دقيقة`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return en ? `${h} h ago` : `منذ ${h} ساعة`;
  }
  const d = Math.floor(diff / 86400);
  return en ? `${d} d ago` : `منذ ${d} يوم`;
}

export function absoluteTime(ts, lang = 'ar') {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ar-EG', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    day: 'numeric',
    month: 'short',
  }).format(new Date(ts));
}

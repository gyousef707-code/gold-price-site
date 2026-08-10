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

// إشعارات المتصفح/الهاتف الحقيقية
export function ensureNotificationPermission() {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  } catch {
    /* تجاهل */
  }
}

function systemNotify(title, body) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return; // ما نزعجش المستخدم وهو فاتح التطبيق
    new Notification(title, { body, icon: '/logo.png', badge: '/logo.png', tag: title });
  } catch {
    /* تجاهل */
  }
}

function pct(a, b) {
  if (!a || !b) return 0;
  return ((b - a) / a) * 100;
}

// بيقارن الأسعار الحالية بآخر نسخة محفوظة وبيولّد إشعارات حقيقية بوقتها
export default function useNotifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setItems(read(KEY, []));
    ensureNotificationPermission();

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
        const add = (type, title, body) => {
          list = push(list, { id: `${type}-${at}`, type, title, body, at });
          systemNotify(title, body);
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
          add('usd', 'تغيّر سعر الدولار', `${now.usd.toLocaleString('en-US')} ج.م للبيع`);
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

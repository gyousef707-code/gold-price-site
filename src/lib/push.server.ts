import {
  buildPushPayload,
  type PushSubscription as WebPushSubscription,
  type VapidKeys,
} from "@block65/webcrypto-web-push";
import { upstash } from "./upstash.server";

// تنبيه سعر مستهدف واحد مخزّن مع اشتراك الجهاز.
// ref = السعر وقت التفعيل (بيحدد الاتجاه: لو الهدف أعلى منه ننتظر الصعود، وإلا الهبوط)
// firedAt = وقت ما التنبيه اتبعت (التنبيه بيتبعت مرة واحدة بس لكل تفعيل)
export type StoredAlert = { target: number; ref: number | null; firedAt?: number };

export const ALERT_KEYS = [
  "gold24",
  "gold21",
  "gold18",
  "goldPound",
  "silver999",
  "silver925",
  "silver900",
  "usdSaygha",
  "marketGap",
] as const;
export type AlertKeyName = (typeof ALERT_KEYS)[number];
export type StoredAlerts = Partial<Record<AlertKeyName, StoredAlert>>;

export type StoredSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  alerts?: StoredAlerts;
};

async function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// -------- تخزين الاشتراكات --------
//
// كل الاشتراكات متخزنة في Hash واحد بس ("push:subs:hash") بدل ما كل اشتراك
// يكون له مفتاح منفصل. الفايدة: جلب كل الاشتراكات بيبقى طلب HTTP واحد بس
// (HGETALL) بدل ما نعمل SMEMBERS ثم طلب GET منفصل لكل مشترك — وده كان
// السبب الرئيسي في تخطي حد "Too many subrequests" بتاع Cloudflare مع زيادة
// عدد المشتركين، لأن كل مشترك كان بيكلفنا طلب HTTP إضافي بس عشان نجيب بياناته.
const SUBS_HASH_KEY = "push:subs:hash";

export async function saveSubscription(sub: StoredSubscription) {
  const id = await sha256Hex(sub.endpoint);
  // الجهاز بيعيد الاشتراك كل ما الصفحة تتفتح — لازم نحافظ على تنبيهاته
  // المخزّنة بدل ما نمسحها بنسخة الاشتراك الجديدة (اللي مفيهاش تنبيهات).
  let alerts: StoredAlerts | undefined;
  try {
    const raw = await upstash("HGET", SUBS_HASH_KEY, id);
    if (raw) alerts = (JSON.parse(raw) as StoredSubscription).alerts;
  } catch {
    // لو القراءة فشلت نكمل تسجيل الاشتراك عادي
  }
  const record: StoredSubscription = {
    endpoint: sub.endpoint,
    keys: sub.keys,
    ...(alerts ? { alerts } : {}),
  };
  await upstash("HSET", SUBS_HASH_KEY, id, JSON.stringify(record));
  return id;
}

async function readSubscriptionById(id: string): Promise<StoredSubscription | null> {
  const raw = await upstash("HGET", SUBS_HASH_KEY, id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSubscription;
  } catch {
    return null;
  }
}

// بيرجّع تنبيهات الجهاز (أو null لو الجهاز مش مشترك أصلاً)
export async function getSubscriptionAlerts(endpoint: string): Promise<StoredAlerts | null> {
  const sub = await readSubscriptionById(await sha256Hex(endpoint));
  if (!sub) return null;
  return sub.alerts ?? {};
}

// بيستبدل تنبيهات الجهاز بالمجموعة المفعّلة اللي جاية من الصفحة.
// - لو التنبيه نفس الهدف وما اتبعتش قبل كده، بنحافظ على ref القديم (الاتجاه ثابت).
// - لو الهدف اتغيّر أو التنبيه كان اتبعت قبل كده وإنت فعّلته تاني، بنبدأ من جديد.
export async function setSubscriptionAlerts(
  endpoint: string,
  incoming: Partial<Record<string, { target: unknown; ref: unknown }>>,
): Promise<StoredAlerts | null> {
  const id = await sha256Hex(endpoint);
  const sub = await readSubscriptionById(id);
  if (!sub) return null;

  const old = sub.alerts ?? {};
  const next: StoredAlerts = {};
  for (const key of ALERT_KEYS) {
    const item = incoming[key];
    if (!item) continue;
    const target = Number(item.target);
    if (!Number.isFinite(target)) continue;
    const refNum = item.ref == null ? NaN : Number(item.ref);
    const ref = Number.isFinite(refNum) ? refNum : null;
    const existing = old[key];
    if (existing && existing.target === target && !existing.firedAt) {
      next[key] = existing;
    } else {
      next[key] = { target, ref };
    }
  }

  sub.alerts = next;
  await upstash("HSET", SUBS_HASH_KEY, id, JSON.stringify(sub));
  return next;
}

// تعديلات صغيرة من الفحص الدوري (تثبيت ref أو تعليم تنبيه إنه اتبعت).
// بنقرأ السجل من جديد قبل الكتابة، وبنعدّل التنبيه بس لو لسه نفس الهدف،
// عشان لو المستخدم غيّر تنبيهاته في نفس اللحظة ما نمسحش تعديله.
async function patchSubscriptionAlerts(
  id: string,
  patches: Array<{ key: AlertKeyName; target: number; ref?: number; firedAt?: number }>,
) {
  const sub = await readSubscriptionById(id);
  if (!sub?.alerts) return;
  let changed = false;
  for (const p of patches) {
    const a = sub.alerts[p.key];
    if (!a || a.target !== p.target || a.firedAt) continue;
    if (p.ref !== undefined) a.ref = p.ref;
    if (p.firedAt !== undefined) a.firedAt = p.firedAt;
    changed = true;
  }
  if (changed) await upstash("HSET", SUBS_HASH_KEY, id, JSON.stringify(sub));
}

async function removeSubscriptionById(id: string) {
  await upstash("HDEL", SUBS_HASH_KEY, id);
}

export async function removeSubscriptionByEndpoint(endpoint: string) {
  const id = await sha256Hex(endpoint);
  await removeSubscriptionById(id);
}

export async function getAllSubscriptions(): Promise<Array<{ id: string; sub: StoredSubscription }>> {
  // Upstash REST بيرجع نتيجة HGETALL كمصفوفة مسطّحة: [field1, value1, field2, value2, ...]
  const flat: string[] = (await upstash("HGETALL", SUBS_HASH_KEY)) || [];
  const out: Array<{ id: string; sub: StoredSubscription }> = [];

  for (let i = 0; i < flat.length; i += 2) {
    const id = flat[i]!;
    const raw = flat[i + 1];
    if (!raw) continue;
    try {
      out.push({ id, sub: JSON.parse(raw) });
    } catch {
      // تجاهل أي قيمة تالفة بهدوء، بدون طلب شبكة إضافي للحذف الفوري
    }
  }
  return out;
}

// -------- إرسال Push حقيقي (VAPID + تشفير aes128gcm) --------

function getVapid(): VapidKeys {
  const subject = process.env['VAPID_SUBJECT'];
  const publicKey = process.env['VAPID_PUBLIC_KEY'];
  const privateKey = process.env['VAPID_PRIVATE_KEY'];
  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "متغيرات VAPID غير مضبوطة (VAPID_SUBJECT / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)",
    );
  }
  return { subject, publicKey, privateKey };
}

export async function sendPushToAll(
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
  },
  preloaded?: Array<{ id: string; sub: StoredSubscription }>,
) {
  const vapid = getVapid();
  const subs = preloaded ?? (await getAllSubscriptions());
  let sent = 0;
  let removed = 0;

  await Promise.all(
    subs.map(async ({ id, sub }) => {
      try {
        const request = await buildPushPayload(
          { data: JSON.stringify(payload), options: { ttl: 120, urgency: "normal" } },
          sub as WebPushSubscription,
          vapid,
        );
        const res = await fetch(sub.endpoint, request as RequestInit);
        if (res.status === 404 || res.status === 410) {
          await removeSubscriptionById(id);
          removed++;
          return;
        }
        if (res.ok) sent++;
      } catch {
        // فشل إرسال اشتراك واحد ما يوقفش الباقي
      }
    }),
  );

  return { sent, removed, total: subs.length };
}

// -------- مقارنة الأسعار وبناء نص الإشعار --------

type Snapshot = {
  k21: number | null;
  k24: number | null;
  ounce: number | null;
  pound: number | null;
  usd: number | null;
  btc: number | null;
};

const EMPTY_SNAPSHOT: Snapshot = {
  k21: null,
  k24: null,
  ounce: null,
  pound: null,
  usd: null,
  btc: null,
};

function pct(a: number, b: number) {
  if (!a || !b) return 0;
  return ((b - a) / a) * 100;
}

export async function getSnapshot(): Promise<Snapshot> {
  const raw = await upstash("GET", "push:last-snapshot");
  if (!raw) return EMPTY_SNAPSHOT;
  try {
    return { ...EMPTY_SNAPSHOT, ...JSON.parse(raw) };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export async function saveSnapshot(snap: Snapshot) {
  await upstash("SET", "push:last-snapshot", JSON.stringify(snap));
}

// -------- دورة الإشعارات: عيار 21 ← عيار 24 ← الدولار ← تكرار --------

export const ROTATION_ORDER = ["k21", "k24", "usd"] as const;
export type RotationKey = (typeof ROTATION_ORDER)[number];

export async function getRotationIndex(): Promise<number> {
  const raw = await upstash("GET", "push:rotation-index");
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function saveRotationIndex(n: number) {
  await upstash("SET", "push:rotation-index", String(n % ROTATION_ORDER.length));
}

// كل استدعاء يبني رسالة على معدن واحد بس (حسب الدور الحالي)، مش كل التغييرات مع بعض
// ملحوظة: الدولار له شرط إضافي (تغيّر 0.1% على الأقل) عشان ما يبعتش مع أي تغيّر تافه
export function buildChangeMessage(prev: Snapshot, now: Snapshot, which: RotationKey) {
  if (which === "k21") {
    if (!prev.k21 || !now.k21 || prev.k21 === now.k21) return null;
    const d = now.k21 - prev.k21;
    return {
      title: "سعر عيار 21",
      body: `عيار 21: ${prev.k21.toLocaleString("en-US")} ← ${now.k21.toLocaleString("en-US")} ج.م (${d > 0 ? "+" : ""}${d.toFixed(0)})`,
    };
  }

  if (which === "k24") {
    if (!prev.k24 || !now.k24 || prev.k24 === now.k24) return null;
    const d = now.k24 - prev.k24;
    return {
      title: "سعر عيار 24",
      body: `عيار 24: ${prev.k24.toLocaleString("en-US")} ← ${now.k24.toLocaleString("en-US")} ج.م (${d > 0 ? "+" : ""}${d.toFixed(0)})`,
    };
  }

  // which === "usd" — بس لو التغيّر 0.1% أو أكتر (مش أي فرق شعرة)
  if (!prev.usd || !now.usd || Math.abs(pct(prev.usd, now.usd)) < 0.1) return null;
  const d = now.usd - prev.usd;
  return {
    title: "سعر الدولار",
    body: `الدولار: ${prev.usd.toFixed(2)} ← ${now.usd.toFixed(2)} ج.م للبيع (${d > 0 ? "+" : ""}${d.toFixed(2)})`,
  };
}

export function computeSnapshot(gold: any, currency: any, crypto: any): Snapshot {
  return {
    k21: gold?.caratPrices?.["21"]?.sell ?? null,
    k24: gold?.caratPrices?.["24"]?.sell ?? null,
    ounce: gold?.ounce_usd ?? null,
    pound: gold?.pound?.sell ?? null,
    usd: currency?.rates?.usd?.sell ?? null,
    btc: crypto?.coins?.find((c: any) => c.id === "bitcoin")?.price_usd ?? null,
  };
}

// -------- تنبيهات السعر المستهدف (لكل جهاز على حدة) --------

const ALERT_LABELS: Record<AlertKeyName, { ar: string; unit: string }> = {
  gold24: { ar: "عيار 24", unit: "ج.م" },
  gold21: { ar: "عيار 21", unit: "ج.م" },
  gold18: { ar: "عيار 18", unit: "ج.م" },
  goldPound: { ar: "الجنيه الذهب", unit: "ج.م" },
  silver999: { ar: "فضة عيار 999", unit: "ج.م" },
  silver925: { ar: "فضة عيار 925", unit: "ج.م" },
  silver900: { ar: "فضة عيار 900", unit: "ج.م" },
  usdSaygha: { ar: "دولار الصاغة", unit: "ج.م" },
  marketGap: { ar: "فجوة السوق", unit: "%" },
};

export type LiveAlertPrices = Partial<Record<AlertKeyName, number | null>>;

export function computeAlertPrices(gold: any, silver: any): LiveAlertPrices {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    gold24: num(gold?.caratPrices?.["24"]?.sell),
    gold21: num(gold?.caratPrices?.["21"]?.sell),
    gold18: num(gold?.caratPrices?.["18"]?.sell),
    goldPound: num(gold?.pound?.sell),
    silver999: num(silver?.silverPrices?.["999"]?.sell),
    silver925: num(silver?.silverPrices?.["925"]?.sell),
    silver900: num(silver?.silverPrices?.["900"]?.sell),
    usdSaygha: num(gold?.implied_usd_rate),
    marketGap: num(gold?.gap_value),
  };
}

// هل في أي جهاز عنده تنبيه فضة لسه ما اتبعتش؟ (عشان ما نجيبش أسعار الفضة من غير لزوم)
export function anySilverAlerts(subs: Array<{ sub: StoredSubscription }>) {
  return subs.some(({ sub }) =>
    (["silver999", "silver925", "silver900"] as const).some(
      (k) => sub.alerts?.[k] && !sub.alerts[k]!.firedAt,
    ),
  );
}

function fmt(n: number, unit: string) {
  return unit === "%"
    ? `${n.toFixed(2)}%`
    : `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${unit}`;
}

// بيفحص تنبيهات كل الأجهزة مقابل الأسعار الحالية ويبعت Push خاص بكل جهاز
// وصل هدفه. التنبيه بيتبعت مرة واحدة بس، وبعدها بيتعلّم إنه اتبعت.
export async function processPriceAlerts(
  subs: Array<{ id: string; sub: StoredSubscription }>,
  prices: LiveAlertPrices,
) {
  let fired = 0;
  let failed = 0;
  let vapid: VapidKeys | null = null;

  for (const { id, sub } of subs) {
    if (!sub.alerts) continue;
    const patches: Array<{ key: AlertKeyName; target: number; ref?: number; firedAt?: number }> = [];
    const hits: Array<{ key: AlertKeyName; target: number; price: number }> = [];

    for (const key of ALERT_KEYS) {
      const a = sub.alerts[key];
      const price = prices[key];
      if (!a || a.firedAt || price == null) continue;

      // مفيش سعر مرجعي (الصفحة ما كانتش عارفة السعر الحي وقت التفعيل):
      // نثبّت السعر الحالي كمرجع الأول، ونبدأ المقارنة من الفحص الجاي.
      if (a.ref == null) {
        patches.push({ key, target: a.target, ref: price });
        continue;
      }

      const goingUp = a.target >= a.ref;
      const reached = goingUp ? price >= a.target : price <= a.target;
      if (reached) hits.push({ key, target: a.target, price });
    }

    for (const h of hits) {
      const label = ALERT_LABELS[h.key];
      try {
        vapid ??= getVapid();
        const request = await buildPushPayload(
          {
            data: JSON.stringify({
              title: "وصل السعر لهدفك 🎯",
              body: `${label.ar} وصل ${fmt(h.price, label.unit)} (هدفك ${fmt(h.target, label.unit)})`,
              url: "/alerts",
              tag: `alert-${h.key}`,
            }),
            options: { ttl: 3600, urgency: "high" },
          },
          sub as WebPushSubscription,
          vapid,
        );
        const res = await fetch(sub.endpoint, request as RequestInit);
        if (res.status === 404 || res.status === 410) {
          await removeSubscriptionById(id); // الجهاز مبقاش مشترك
          break;
        }
        if (res.ok) {
          patches.push({ key: h.key, target: h.target, firedAt: Date.now() });
          fired++;
        } else {
          failed++; // هيحاول تاني في الفحص الجاي
        }
      } catch {
        failed++;
      }
    }

    if (patches.length) await patchSubscriptionAlerts(id, patches).catch(() => {});
  }

  return { fired, failed };
}

import {
  buildPushPayload,
  type PushSubscription as WebPushSubscription,
  type VapidKeys,
} from "@block65/webcrypto-web-push";
import { upstash } from "./upstash.server";

export type StoredSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

async function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// -------- تخزين الاشتراكات --------

export async function saveSubscription(sub: StoredSubscription) {
  const id = await sha256Hex(sub.endpoint);
  await upstash("SET", `push:sub:${id}`, JSON.stringify(sub));
  await upstash("SADD", "push:subs", id);
  return id;
}

async function removeSubscriptionById(id: string) {
  await upstash("DEL", `push:sub:${id}`);
  await upstash("SREM", "push:subs", id);
}

export async function removeSubscriptionByEndpoint(endpoint: string) {
  const id = await sha256Hex(endpoint);
  await removeSubscriptionById(id);
}

export async function getAllSubscriptions(): Promise<Array<{ id: string; sub: StoredSubscription }>> {
  const ids: string[] = (await upstash("SMEMBERS", "push:subs")) || [];
  const out: Array<{ id: string; sub: StoredSubscription }> = [];

  for (const id of ids) {
    const raw = await upstash("GET", `push:sub:${id}`);
    if (!raw) {
      await removeSubscriptionById(id);
      continue;
    }
    try {
      out.push({ id, sub: JSON.parse(raw) });
    } catch {
      await removeSubscriptionById(id);
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

export async function sendPushToAll(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  const vapid = getVapid();
  const subs = await getAllSubscriptions();
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

  // which === "usd"
  if (!prev.usd || !now.usd || prev.usd === now.usd) return null;
  const d = now.usd - prev.usd;
  return {
    title: "سعر الدولار",
    body: `الدولار: ${prev.usd.toLocaleString("en-US")} ← ${now.usd.toLocaleString("en-US")} ج.م للبيع (${d > 0 ? "+" : ""}${d.toFixed(2)})`,
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

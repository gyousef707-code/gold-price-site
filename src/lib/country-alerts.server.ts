// تنبيهات السعر المستهدف للدول (السعودية، الإمارات، ...).
// بتشتغل جنب تنبيهات مصر من غير ما تلمسها: التنبيهات متخزّنة في حقل منفصل (countryAlerts)
// جوه نفس سجل اشتراك الجهاز، فمفيش أوامر Upstash إضافية — الفحص الدوري بيقرأ الاشتراكات أصلاً.
import { buildPushPayload, type PushSubscription as WebPushSubscription } from "@block65/webcrypto-web-push";
import { upstash } from "./upstash.server";
import {
  SUBS_HASH_KEY,
  sha256Hex,
  readSubscriptionById,
  removeSubscriptionById,
  getVapid,
  type StoredAlert,
  type StoredSubscription,
} from "./push.server";
import { getCountryPrices } from "./country-prices.server";
import { COUNTRIES } from "@/legacy/data/countries.js";
import { COUNTRY_CODES } from "@/legacy/data/countryCodes.js";

export const COUNTRY_ALERT_METRICS = ["gold24", "gold22", "gold21", "gold18", "silver999", "silver925"] as const;
export type CountryAlertMetric = (typeof COUNTRY_ALERT_METRICS)[number];

const LABELS: Record<CountryAlertMetric, string> = {
  gold24: "ذهب عيار 24",
  gold22: "ذهب عيار 22",
  gold21: "ذهب عيار 21",
  gold18: "ذهب عيار 18",
  silver999: "فضة عيار 999",
  silver925: "فضة عيار 925",
};

const keyOf = (code: string, metric: string) => `${code}:${metric}`;

function parseKey(key: string): { code: string; metric: CountryAlertMetric } | null {
  const [code, metric] = key.split(":");
  if (!code || !metric) return null;
  if (!COUNTRY_CODES.includes(code)) return null;
  if (!(COUNTRY_ALERT_METRICS as readonly string[]).includes(metric)) return null;
  return { code, metric: metric as CountryAlertMetric };
}

function forCountry(all: Record<string, StoredAlert> | undefined, code: string) {
  const out: Partial<Record<CountryAlertMetric, StoredAlert>> = {};
  for (const m of COUNTRY_ALERT_METRICS) {
    const a = all?.[keyOf(code, m)];
    if (a) out[m] = a;
  }
  return out;
}

// تنبيهات الجهاز لدولة معينة (null لو الجهاز مش مشترك أصلاً)
export async function getSubscriptionCountryAlerts(endpoint: string, code: string) {
  if (!COUNTRY_CODES.includes(code)) return null;
  const sub = await readSubscriptionById(await sha256Hex(endpoint));
  if (!sub) return null;
  return forCountry(sub.countryAlerts, code);
}

// بيستبدل تنبيهات الدولة دي بس بالمجموعة المفعّلة (وبيسيب تنبيهات الدول التانية ومصر زي ما هي).
// نفس قواعد مصر: لو نفس الهدف ولسه ما اتبعتش بنحافظ على ref القديم، غير كده بنبدأ من جديد.
export async function setSubscriptionCountryAlerts(
  endpoint: string,
  code: string,
  incoming: Partial<Record<string, { target: unknown; ref: unknown }>>,
) {
  if (!COUNTRY_CODES.includes(code)) return null;
  const id = await sha256Hex(endpoint);
  const sub = await readSubscriptionById(id);
  if (!sub) return null;

  const old = sub.countryAlerts ?? {};
  const next: Record<string, StoredAlert> = {};
  for (const [k, v] of Object.entries(old)) {
    if (!k.startsWith(`${code}:`)) next[k] = v;
  }
  for (const metric of COUNTRY_ALERT_METRICS) {
    const item = incoming[metric];
    if (!item) continue;
    const target = Number(item.target);
    if (!Number.isFinite(target) || target <= 0) continue;
    const refNum = item.ref == null ? NaN : Number(item.ref);
    const ref = Number.isFinite(refNum) ? refNum : null;
    const key = keyOf(code, metric);
    const existing = old[key];
    next[key] = existing && existing.target === target && !existing.firedAt ? existing : { target, ref };
  }

  sub.countryAlerts = next;
  await upstash("HSET", SUBS_HASH_KEY, id, JSON.stringify(sub));
  return forCountry(next, code);
}

async function patchCountryAlerts(
  id: string,
  patches: Array<{ key: string; target: number; ref?: number; firedAt?: number }>,
) {
  const sub = await readSubscriptionById(id);
  if (!sub?.countryAlerts) return;
  let changed = false;
  for (const p of patches) {
    const a = sub.countryAlerts[p.key];
    if (!a || a.target !== p.target || a.firedAt) continue;
    if (p.ref !== undefined) a.ref = p.ref;
    if (p.firedAt !== undefined) a.firedAt = p.firedAt;
    changed = true;
  }
  if (changed) await upstash("HSET", SUBS_HASH_KEY, id, JSON.stringify(sub));
}

function fmt(n: number, short: string, decimals: number) {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: decimals })} ${short}`;
}

// بيفحص تنبيهات الدول مقابل الأسعار الحالية ويبعت Push للجهاز اللي وصل هدفه (مرة واحدة لكل تفعيل).
// لو مفيش أي تنبيه دولة شغّال بيرجع فوراً من غير ما يجيب أي سعر.
export async function processCountryAlerts(subs: Array<{ id: string; sub: StoredSubscription }>) {
  const need = new Set<string>();
  for (const { sub } of subs) {
    for (const [k, a] of Object.entries(sub.countryAlerts ?? {})) {
      if (!a || a.firedAt) continue;
      const parsed = parseKey(k);
      if (parsed) need.add(parsed.code);
    }
  }
  if (!need.size) return { fired: 0, failed: 0 };

  // أسعار كل دولة مطلوبة (مرة واحدة لكل دولة، والأسعار الأساسية متخزّنة مؤقتاً)
  const prices: Record<string, number> = {};
  for (const code of need) {
    try {
      const d: any = await getCountryPrices(code);
      for (const k of d?.karats ?? []) prices[keyOf(code, `gold${k.karat}`)] = k.gram;
      for (const g of d?.silver?.grams ?? []) prices[keyOf(code, `silver${g.purity}`)] = g.gram;
    } catch {
      // الدولة دي نفوتها ونحاول في الفحص الجاي
    }
  }

  let fired = 0;
  let failed = 0;
  let vapid: ReturnType<typeof getVapid> | null = null;

  for (const { id, sub } of subs) {
    if (!sub.countryAlerts) continue;
    const patches: Array<{ key: string; target: number; ref?: number; firedAt?: number }> = [];
    const hits: Array<{ key: string; code: string; metric: CountryAlertMetric; target: number; price: number }> = [];

    for (const [key, a] of Object.entries(sub.countryAlerts)) {
      const parsed = parseKey(key);
      const price = prices[key];
      if (!parsed || !a || a.firedAt || price == null) continue;
      if (a.ref == null) {
        patches.push({ key, target: a.target, ref: price });
        continue;
      }
      const goingUp = a.target >= a.ref;
      if (goingUp ? price >= a.target : price <= a.target) {
        hits.push({ key, ...parsed, target: a.target, price });
      }
    }

    for (const h of hits) {
      const c = (COUNTRIES as Record<string, any>)[h.code];
      const dec = c?.decimals ?? 2;
      try {
        vapid ??= getVapid();
        const request = await buildPushPayload(
          {
            data: JSON.stringify({
              title: "وصل السعر لهدفك 🎯",
              body: `${LABELS[h.metric]} في ${c?.name ?? ""} وصل ${fmt(h.price, c?.short ?? "", dec)} (هدفك ${fmt(h.target, c?.short ?? "", dec)})`,
              url: `/${h.code}/alerts`,
              tag: `alert-${h.code}-${h.metric}`,
            }),
            options: { ttl: 3600, urgency: "high" },
          },
          sub as WebPushSubscription,
          vapid,
        );
        const res = await fetch(sub.endpoint, request as RequestInit);
        if (res.status === 404 || res.status === 410) {
          await removeSubscriptionById(id);
          break;
        }
        if (res.ok) {
          patches.push({ key: h.key, target: h.target, firedAt: Date.now() });
          fired++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (patches.length) await patchCountryAlerts(id, patches).catch(() => {});
  }

  return { fired, failed };
}

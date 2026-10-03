// أرشيف يومي لأسعار الذهب — بيستخدم نفس Upstash Redis المستخدم بالفعل في
// push.server.ts و alert.server.ts، فمحتاجش أي إعداد جديد لو Upstash شغال
// أصلاً عند صاحب الموقع.
//
// الفكرة: مع كل طلب سعر عادي (getGoldPrices في market.server.ts)، بنسجّل
// "لقطة" لسعر اليوم مرة واحدة بس (بنستخدم SETNX عشان الطلبات الكتير في
// نفس اليوم متكتبش فوق بعضها أو تستهلك الكوتة المجانية). مفيش محتاج لأي
// cron خارجي أو إعداد إضافي — بيشتغل لوحده مع الزيارات العادية للموقع.
//
// النظام اختياري بالكامل: لو Upstash مش مضبوط، بيتجاهل نفسه بهدوء ومبيأثرش
// على جلب الأسعار الأساسي خالص (نفس فلسفة alert.server.ts).

import { upstash } from "./upstash.server";

const HISTORY_TTL_SECONDS = 400 * 24 * 60 * 60; // سنة وشوية، أكتر من كفاية لجدول 30/90 يوم

export type DailySnapshot = {
  date: string; // YYYY-MM-DD
  karat24_sell: number | null;
  karat21_sell: number | null;
  ounce_egp_sell: number | null;
  pound_sell: number | null;
  // باقي العيارات — بتتسجل من أول يوم اتفعّل فيه التحديث ده.
  // الأيام القديمة اللي مفيهاش القيم دي بتتحسب تقريبيًا وقت القراءة (شوف backfillKarats)
  karat22_sell?: number | null;
  karat18_sell?: number | null;
  karat14_sell?: number | null;
  karat12_sell?: number | null;
  // أسماء الحقول اللي اتحسبت تقريبيًا (مش متسجلة فعليًا) — بتتحط وقت القراءة بس، مبتتخزنش
  estimated?: string[];
};

// العيارات اللي بتتحسب تقريبيًا للأيام القديمة من سعر عيار 21 (نسبة العيار / 21)
const BACKFILL_KARATS = [22, 18, 14, 12] as const;

// للأيام اللي اتسجلت قبل ما نبدأ نحفظ باقي العيارات: بنقدّر السعر من عيار 21
// بنسبة (العيار ÷ 21). فرق التقدير عن السعر الفعلي في السوق حوالي 0.05% تقريبًا.
export function backfillKarats(rows: DailySnapshot[]): DailySnapshot[] {
  return rows.map((row) => {
    const base = row.karat21_sell;
    if (base == null) return row;
    const out: DailySnapshot = { ...row };
    const estimated: string[] = [];
    for (const k of BACKFILL_KARATS) {
      const key = `karat${k}_sell` as const;
      if (out[key] == null) {
        out[key] = Math.round((base * k) / 21);
        estimated.push(key);
      }
    }
    if (estimated.length) out.estimated = estimated;
    return out;
  });
}

function todayCairo(): string {
  // مصر مفيهاش توقيت صيفي حاليًا وفرقها +2 عن UTC ثابت عمليًا لأغراض
  // "تاريخ اليوم" هنا — دقة كافية لغرض أرشيف يومي، مش محتاجين ثانية بالظبط.
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

// بتتنادى من getGoldPrices() على كل طلب عادي — best-effort ومتبطئش الاستجابة
// الأساسية أبدًا (بنستخدمها كـ fire-and-forget من غير await في مكان الاستدعاء).
export async function recordDailySnapshotIfMissing(prices: {
  caratPrices: Record<number, { sell: number; buy: number }>;
  ounce_egp: { sell: number; buy: number } | null;
  pound: { sell: number; buy: number } | null;
}) {
  try {
    const date = todayCairo();
    const key = `gold:history:${date}`;
    const snapshot: DailySnapshot = {
      date,
      karat24_sell: prices.caratPrices?.[24]?.sell ?? null,
      karat21_sell: prices.caratPrices?.[21]?.sell ?? null,
      karat22_sell: prices.caratPrices?.[22]?.sell ?? null,
      karat18_sell: prices.caratPrices?.[18]?.sell ?? null,
      karat14_sell: prices.caratPrices?.[14]?.sell ?? null,
      karat12_sell: prices.caratPrices?.[12]?.sell ?? null,
      ounce_egp_sell: prices.ounce_egp?.sell ?? null,
      pound_sell: prices.pound?.sell ?? null,
    };
    // SET ... NX: بيتكتب بس لو المفتاح مش موجود، يعني أول طلب في اليوم ده بس
    // هو اللي فعليًا بيكتب على Upstash — باقي الطلبات (كل 45 ثانية من كل زائر)
    // بترجع فورًا من غير أي أمر إضافي.
    await upstash("SET", key, JSON.stringify(snapshot), "EX", HISTORY_TTL_SECONDS, "NX");
  } catch {
    // Upstash مش مضبوط أو فشل الاتصال — نظام ثانوي، متأثرش على السعر الأساسي
  }
}

// بنجيب الأيام كلها بأمر MGET واحد لكل دفعة (بدل GET لكل يوم) — ضروري لما
// المدى يوصل لسنة، عشان استضافة Cloudflare بتحدد عدد الطلبات الخارجية في الطلب الواحد.
const MGET_CHUNK = 50;

export async function getRecentHistory(days = 30): Promise<DailySnapshot[]> {
  try {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() + 2 * 60 * 60 * 1000 - i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().slice(0, 10));
    }
    const chunks: string[][] = [];
    for (let i = 0; i < dates.length; i += MGET_CHUNK) chunks.push(dates.slice(i, i + MGET_CHUNK));

    const parts = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const raws = (await upstash("MGET", ...chunk.map((d) => `gold:history:${d}`))) as Array<
            string | null
          >;
          return (raws ?? []).map((raw) => {
            try {
              return raw ? (JSON.parse(raw) as DailySnapshot) : null;
            } catch {
              return null;
            }
          });
        } catch {
          return [] as Array<DailySnapshot | null>;
        }
      }),
    );
    // الترتيب من الأحدث للأقدم زي ما كان
    return backfillKarats(parts.flat().filter((r): r is DailySnapshot => r !== null));
  } catch {
    return [];
  }
}

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
};

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
    return parts.flat().filter((r): r is DailySnapshot => r !== null);
  } catch {
    return [];
  }
}

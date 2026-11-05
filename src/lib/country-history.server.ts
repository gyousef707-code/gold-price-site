// أرشيف يومي للأسعار العالمية (بالدولار) — بيخدم كل الدول.
// الفكرة: بنسجّل لقطة يومية واحدة فيها سعر أونصة الذهب والفضة بالدولار (وسعر صرف العملات
// اللي مش مربوطة بالدولار زي الدينار الكويتي). وقت العرض بنحوّلها لعملة كل دولة، فمحتاجش
// أرشيف منفصل لكل دولة. بيستخدم نفس Upstash بتاع الموقع، واختياري بالكامل: لو Upstash
// مش مضبوط بيتجاهل نفسه بهدوء ومبيأثرش على الأسعار.
import { upstash } from "./upstash.server";

const TTL_SECONDS = 400 * 24 * 60 * 60; // سنة وشوية
const MGET_CHUNK = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

export type GlobalSnapshot = {
  date: string; // YYYY-MM-DD (بتوقيت القاهرة، زي أرشيف مصر عشان الشارت يطابق)
  gold_usd: number;
  silver_usd: number | null;
  // سعر الصرف للعملات المتغيرة: كام وحدة من العملة مقابل 1 دولار
  fx?: Record<string, number>;
};

function dateOf(offsetDays = 0): string {
  return new Date(Date.now() + 2 * 60 * 60 * 1000 - offsetDays * DAY_MS).toISOString().slice(0, 10);
}

// حارس داخل نفس الـ isolate: نحاول نكتب مرة واحدة بس في اليوم، فمنستهلكش أوامر Upstash
// مع كل طلب (الحصة المجانية محدودة ومشتركة مع الإشعارات).
const attempted = new Set<string>();

export async function recordGlobalSnapshotIfMissing(input: Omit<GlobalSnapshot, "date">) {
  try {
    const date = dateOf();
    if (attempted.has(date)) return;
    attempted.add(date);
    if (!Number.isFinite(input.gold_usd) || input.gold_usd <= 0) return;
    const snapshot: GlobalSnapshot = { date, ...input };
    // NX: بيتكتب بس لو مفيش لقطة لليوم ده
    await upstash("SET", `country:history:${date}`, JSON.stringify(snapshot), "EX", TTL_SECONDS, "NX");
    await upstash("SET", "country:history:start", date, "NX");
  } catch {
    // Upstash مش مضبوط أو فشل الاتصال — نظام ثانوي
  }
}

// بيرجّع اللقطات من الأحدث للأقدم، ومن أول يوم اتسجل بس (فمفيش أوامر على أيام فاضية)
export async function getGlobalHistory(days = 30): Promise<GlobalSnapshot[]> {
  try {
    const start = (await upstash("GET", "country:history:start")) as string | null;
    if (!start) return [];
    const sinceStart = Math.floor((new Date(`${dateOf()}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / DAY_MS) + 1;
    const span = Math.max(1, Math.min(days, sinceStart));
    const dates = Array.from({ length: span }, (_, i) => dateOf(i));
    const chunks: string[][] = [];
    for (let i = 0; i < dates.length; i += MGET_CHUNK) chunks.push(dates.slice(i, i + MGET_CHUNK));
    const parts = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const raws = (await upstash("MGET", ...chunk.map((d) => `country:history:${d}`))) as Array<string | null>;
          return (raws ?? []).map((raw) => {
            try {
              return raw ? (JSON.parse(raw) as GlobalSnapshot) : null;
            } catch {
              return null;
            }
          });
        } catch {
          return [] as Array<GlobalSnapshot | null>;
        }
      }),
    );
    return parts.flat().filter((r): r is GlobalSnapshot => r !== null);
  } catch {
    return [];
  }
}

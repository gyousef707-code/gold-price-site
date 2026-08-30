// أرشيف يومي لأسعار الفضة — نفس فكرة gold-history.server.ts بالظبط،
// وبيستخدم نفس Upstash Redis (مفتاح مختلف بس: silver:history:YYYY-MM-DD).

import { upstash } from "./upstash.server";

const HISTORY_TTL_SECONDS = 400 * 24 * 60 * 60;

export type SilverDailySnapshot = {
  date: string; // YYYY-MM-DD
  silver999_sell: number | null;
  silver925_sell: number | null;
};

function todayCairo(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

// بتتنادى من getSilverPrices() — fire-and-forget، مبتأثرش على سرعة السعر الأساسي.
export async function recordSilverSnapshotIfMissing(silverPrices: Record<string, { sell: number; buy: number }>) {
  try {
    const date = todayCairo();
    const key = `silver:history:${date}`;
    const snapshot: SilverDailySnapshot = {
      date,
      silver999_sell: silverPrices?.["999"]?.sell ?? null,
      silver925_sell: silverPrices?.["925"]?.sell ?? null,
    };
    await upstash("SET", key, JSON.stringify(snapshot), "EX", HISTORY_TTL_SECONDS, "NX");
  } catch {
    // Upstash مش مضبوط أو فشل الاتصال — نظام ثانوي، متأثرش على السعر الأساسي
  }
}

export async function getRecentSilverHistory(days = 30): Promise<SilverDailySnapshot[]> {
  try {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() + 2 * 60 * 60 * 1000 - i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().slice(0, 10));
    }
    const results = await Promise.all(
      dates.map(async (date) => {
        try {
          const raw = await upstash("GET", `silver:history:${date}`);
          return raw ? (JSON.parse(raw) as SilverDailySnapshot) : null;
        } catch {
          return null;
        }
      }),
    );
    return results.filter((r): r is SilverDailySnapshot => r !== null);
  } catch {
    return [];
  }
}

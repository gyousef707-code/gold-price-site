// أسعار الذهب والفضة لكل دولة خليجية/عربية: بتتحسب من السعر العالمي للأونصة
// (بالدولار) × سعر الصرف المحلي. سعر استرشادي — مفيهوش مصنعية ولا ضريبة.
import { getGoldPrices, getSilverPrices, getCurrencyRates } from "./market.server";
import { COUNTRIES, GOLD_KARATS, SILVER_PURITIES } from "@/legacy/data/countries.js";

const GRAMS_PER_OUNCE = 31.1034768;
const GOLD_PURITY: Record<number, number> = { 24: 0.999, 22: 0.916, 21: 0.875, 18: 0.75 };
const SILVER_PURITY: Record<number, number> = { 999: 0.999, 925: 0.925 };

export async function getCountryPrices(code: string) {
  const c = (COUNTRIES as Record<string, any>)[code];
  if (!c || !c.active || c.isHome) return null;

  const [gold, silver, rates] = await Promise.all([
    getGoldPrices(),
    getSilverPrices().catch(() => null),
    getCurrencyRates().catch(() => null),
  ]);

  const ounceUsd = Number((gold as any).ounce_usd);
  if (!Number.isFinite(ounceUsd) || ounceUsd <= 0) throw new Error("تعذر جلب سعر الأونصة");

  // سعر الصرف: عملة محلية مقابل 1 دولار
  let fx: number | null = typeof c.peg === "number" ? c.peg : null;
  let fxSource: "peg" | "market" | "fallback" = "peg";
  if (fx == null) {
    const r = rates as any;
    const usdMid = r?.usd?.mid;
    const localMid = r?.[c.currency]?.mid;
    if (usdMid && localMid) {
      fx = usdMid / localMid;
      fxSource = "market";
    } else {
      fx = c.fallbackFx ?? null;
      fxSource = "fallback";
    }
  }
  if (!fx) throw new Error("تعذر تحديد سعر الصرف");

  const gramOf = (ounce: number, purity: number) => (ounce / GRAMS_PER_OUNCE) * purity * fx!;

  return {
    country: c.code,
    currency: c.currency,
    fx: Number(fx.toFixed(4)),
    fx_source: fxSource,
    ounce_usd: ounceUsd,
    ounce_local: Number((ounceUsd * fx).toFixed(4)),
    ounce_change_percent: (gold as any).ounce_change_percent ?? null,
    karats: (GOLD_KARATS as number[]).map((k) => ({
      karat: k,
      gram: Number(gramOf(ounceUsd, GOLD_PURITY[k]).toFixed(4)),
    })),
    silver: (silver as any)?.ounce_usd
      ? {
          ounce_usd: Number((silver as any).ounce_usd),
          change_percent: (silver as any).ounce_change_percent ?? null,
          grams: (SILVER_PURITIES as number[]).map((p) => ({
            purity: p,
            gram: Number(gramOf(Number((silver as any).ounce_usd), SILVER_PURITY[p]).toFixed(4)),
          })),
        }
      : null,
    updated_at: new Date().toISOString(),
  };
}

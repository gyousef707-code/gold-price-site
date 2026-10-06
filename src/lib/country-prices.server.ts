// أسعار كل دولة: بتتحسب من الأسعار العالمية (بالدولار) × سعر الصرف المحلي.
// سعر استرشادي — مفيهوش مصنعية ولا ضريبة.
import { getGoldPrices, getSilverPrices, getCurrencyRates, getCryptoPrices } from "./market.server";
import { COUNTRIES, GOLD_KARATS, SILVER_PURITIES } from "@/legacy/data/countries.js";

const GRAMS_PER_OUNCE = 31.1034768;
const GOLD_PURITY: Record<number, number> = { 24: 0.999, 22: 0.916, 21: 0.875, 18: 0.75 };
const SILVER_PURITY: Record<number, number> = { 999: 0.999, 925: 0.925, 900: 0.9, 800: 0.8 };
const CROSS_CURRENCIES = ["usd", "eur", "gbp", "sar", "aed", "kwd", "qar", "bhd", "omr", "jod", "egp", "chf", "jpy", "cny", "try"];

function activeCountry(code: string) {
  const c = (COUNTRIES as Record<string, any>)[code];
  return c && c.active && !c.isHome ? c : null;
}

// سعر الصرف: عملة الدولة مقابل 1 دولار (الربط الرسمي أو من السوق)
async function resolveFx(c: any, rates: any) {
  if (typeof c.peg === "number") return { fx: c.peg as number, source: "peg" as const };
  const usdMid = rates?.rates?.usd?.mid;
  const localMid = rates?.rates?.[c.currency]?.mid;
  if (usdMid && localMid) return { fx: usdMid / localMid, source: "market" as const };
  if (c.fallbackFx) return { fx: c.fallbackFx as number, source: "fallback" as const };
  throw new Error("تعذر تحديد سعر الصرف");
}

export async function getCountryPrices(code: string) {
  const c = activeCountry(code);
  if (!c) return null;
  const [gold, silver, rates] = await Promise.all([
    getGoldPrices(),
    getSilverPrices().catch(() => null),
    getCurrencyRates().catch(() => null),
  ]);
  const ounceUsd = Number((gold as any).ounce_usd);
  if (!Number.isFinite(ounceUsd) || ounceUsd <= 0) throw new Error("تعذر جلب سعر الأونصة");
  const { fx, source } = await resolveFx(c, rates);
  const gramOf = (ounce: number, purity: number) => (ounce / GRAMS_PER_OUNCE) * purity * fx;
  return {
    country: c.code,
    currency: c.currency,
    fx: Number(fx.toFixed(4)),
    fx_source: source,
    ounce_usd: ounceUsd,
    ounce_local: Number((ounceUsd * fx).toFixed(4)),
    ounce_change_percent: (gold as any).ounce_change_percent ?? null,
    karats: (GOLD_KARATS as number[]).map((k) => ({ karat: k, gram: Number(gramOf(ounceUsd, GOLD_PURITY[k]).toFixed(4)) })),
    silver: (silver as any)?.ounce_usd
      ? {
          ounce_usd: Number((silver as any).ounce_usd),
          ounce_local: Number((Number((silver as any).ounce_usd) * fx).toFixed(4)),
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

// أسعار العملات الأجنبية مقابل عملة الدولة (تقاطع عن طريق الدولار)
export async function getCountryCurrencies(code: string) {
  const c = activeCountry(code);
  if (!c) return null;
  const rates: any = await getCurrencyRates();
  const { fx, source } = await resolveFx(c, rates);
  const usdEgp = rates?.rates?.usd?.mid;
  if (!usdEgp) throw new Error("تعذر جلب أسعار العملات");
  const out: Record<string, number> = {};
  for (const cur of CROSS_CURRENCIES) {
    if (cur === c.currency) continue;
    const egp = rates.rates[cur]?.mid;
    if (!egp) continue;
    // 1 وحدة من العملة = كام دولار = كام من عملة الدولة
    out[cur] = Number(((egp / usdEgp) * fx).toFixed(cur === "jpy" ? 5 : 4));
  }
  return { country: c.code, currency: c.currency, fx: Number(fx.toFixed(4)), fx_source: source, rates: out, updated_at: new Date().toISOString() };
}

export async function getCountryCrypto(code: string) {
  const c = activeCountry(code);
  if (!c) return null;
  const [crypto, rates] = await Promise.all([getCryptoPrices(), getCurrencyRates().catch(() => null)]);
  const { fx, source } = await resolveFx(c, rates);
  const coins = ((crypto as any).coins || []).map((k: any) => ({
    id: k.id,
    symbol: k.symbol,
    name: k.name,
    price_usd: k.price_usd,
    price_local: typeof k.price_usd === "number" ? Number((k.price_usd * fx).toFixed(4)) : null,
    change_24h: k.change_24h,
  }));
  return { country: c.code, currency: c.currency, fx: Number(fx.toFixed(4)), fx_source: source, coins, updated_at: new Date().toISOString() };
}

export async function getCountryData(code: string, type: string) {
  if (type === "currencies") return getCountryCurrencies(code);
  if (type === "crypto") return getCountryCrypto(code);
  return getCountryPrices(code);
}

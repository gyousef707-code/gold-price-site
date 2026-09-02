// مصادر الأسعار اللحظية (ذهب / فضة / عملات / عملات رقمية / أخبار)
// كلها مصادر مجانية بدون مفاتيح API

import { reportSuccess, reportFailure } from "./alert.server";
import { fetchEgyptGoldMarket } from "./egypt-gold.server";
import { recordDailySnapshotIfMissing } from "./gold-history.server";
import { recordSilverSnapshotIfMissing, getYesterdaySilverSnapshot } from "./silver-history.server";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; DahabySite/1.0)" };
const GRAMS_PER_OUNCE = 31.1034768;
const GOLD_PURITY: Record<number, number> = {
  24: 0.999, 22: 0.916, 21: 0.875, 18: 0.75, 14: 0.583, 12: 0.5,
};
const SILVER_PURITY: Record<string, number> = {
  999: 0.999, 925: 0.925, 900: 0.9, 800: 0.8, 720: 0.72, 500: 0.5,
};

function stripTagsKeepPercent(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}
function stripPercents(text: string) {
  return text.replace(/[-+]?\d+(?:\.\d+)?%/g, " ").replace(/\s+/g, " ");
}
function extractPair(text: string, label: string) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const after = text.slice(idx + label.length, idx + label.length + 150);
  const nums = after.match(/[\d,]+\.?\d*/g);
  if (!nums || nums.length < 2) return null;
  const v1 = parseFloat(nums[0]!.replace(/,/g, ""));
  const v2 = parseFloat(nums[1]!.replace(/,/g, ""));
  if (isNaN(v1) || isNaN(v2)) return null;
  return { sell: Math.max(v1, v2), buy: Math.min(v1, v2) };
}
function extractOne(text: string, label: string) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const after = text.slice(idx + label.length, idx + label.length + 60);
  const nums = after.match(/[\d,]+\.?\d*/g);
  if (!nums || nums.length < 1) return null;
  const v = parseFloat(nums[0]!.replace(/,/g, ""));
  return isNaN(v) ? null : v;
}

const CURRENCIES: Record<string, string> = {
  usd: "USDEGP", eur: "EUREGP", gbp: "GBPEGP", sar: "SAREGP",
  aed: "AEDEGP", kwd: "KWDEGP", qar: "QAREGP", bhd: "BHDEGP",
  omr: "OMREGP", jod: "JODEGP", chf: "CHFEGP", jpy: "JPYEGP",
  cny: "CNYEGP", try: "TRYEGP",
};

async function fetchCurrencyRates() {
  const SPREAD = 0.002;
  const rates: Record<string, { mid: number; buy: number; sell: number }> = {
    egp: { mid: 1, buy: 1, sell: 1 },
  };
  const put = (code: string, mid: number) => {
    if (!mid || !isFinite(mid) || mid <= 0) return;
    rates[code] = {
      mid: Number(mid.toFixed(4)),
      buy: Number((mid * (1 - SPREAD)).toFixed(4)),
      sell: Number((mid * (1 + SPREAD)).toFixed(4)),
    };
  };

  const sources: string[] = [];

  // 1) أسعار البنوك المصرية (المصدر الأساسي)
  try {
    const res = await fetch("https://banklive.net/en/currencies", {
      headers: UA,
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const text = stripTagsKeepPercent(await res.text());
      for (const [code, label] of Object.entries(CURRENCIES)) {
        const mid = extractOne(text, label);
        if (mid) put(code, mid);
      }
      if (Object.keys(rates).length > 1) sources.push("banklive.net");
    }
  } catch {
    // نكمل على المصدر الاحتياطي
  }

  // 2) مصدر احتياطي مجاني لأي عملة ناقصة
  if (Object.keys(rates).length < Object.keys(CURRENCIES).length + 1) {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data: any = await res.json();
        const usdEgp = data?.rates?.EGP;
        if (usdEgp) {
          for (const code of Object.keys(CURRENCIES)) {
            if (rates[code]) continue;
            const perUsd = data.rates[code.toUpperCase()];
            if (code === "usd") put("usd", usdEgp);
            else if (perUsd) put(code, usdEgp / perUsd);
          }
          sources.push("exchangerate-api.com");
        }
      }
    } catch {
      // نتجاهل: لو فيه أسعار من المصدر الأول هترجع زي ما هي
    }
  }

  if (Object.keys(rates).length < 6) throw new Error("لم يتم العثور على أسعار كافية للعملات");
  return {
    source: sources.join(" + ") || "banklive.net",
    rates,
    updated_at: new Date().toISOString(),
  };
}

async function safeUsdRate(fallback: number | null = null) {
  try {
    const c = await getCurrencyRates();
    return c.rates["usd"]?.mid ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchGoldPrices() {
  // المصدر الأساسي: أسعار محلات الصاغة المصرية الفعلية (نفس أرقام التطبيقات المصرية)
  try {
    return await fetchLocalGoldPrices();
  } catch {
    return await fetchComputedGoldPrices();
  }
}

async function fetchLocalGoldPrices() {
  const [local, globalOunce] = await Promise.all([
    fetchEgyptGoldMarket(),
    fetchGlobalOunce("XAU").catch(() => null),
  ]);

  const k24 = local.karats[24]!;
  const pureGramSell = k24.sell / GOLD_PURITY[24]!;
  const pureGramBuy = k24.buy / GOLD_PURITY[24]!;

  const caratPrices: Record<number, { sell: number; buy: number }> = {};
  for (const c of [24, 22, 21, 18, 14, 12]) {
    const scraped = local.karats[c];
    caratPrices[c] = scraped ?? {
      // العيارات غير المنشورة (22 و 12) بتتحسب من الذهب الخالص بنسبة النقاء
      sell: Math.round(pureGramSell * GOLD_PURITY[c]!),
      buy: Math.round(pureGramBuy * GOLD_PURITY[c]!),
    };
  }

  const pound =
    local.pound ?? { sell: caratPrices[21]!.sell * 8, buy: caratPrices[21]!.buy * 8 };

  const ounce_usd = globalOunce?.price ?? local.ounce_usd;
  const market_usd_rate = local.market_usd_rate ?? null;
  const bank_usd_rate = local.bank_usd_rate ?? (await safeUsdRate(null));

  // تسجيل لقطة أرشيفية لسعر النهاردة — بدون await عشان متأخرش استجابة السعر
  // اللحظي؛ لو فشلت أو Upstash مش مضبوط، بتتجاهل نفسها بهدوء (شوف الملف نفسه).
  void recordDailySnapshotIfMissing({ caratPrices, ounce_egp: local.ounce_egp, pound });

  return {
    source: "gold-price-today.com (محلات الصاغة) + gold-api.com",
    ounce_usd,
    ounce_egp: local.ounce_egp,
    ounce_change_percent: local.change_percent,
    pound,
    caratPrices,
    bank_usd_rate,
    implied_usd_rate: market_usd_rate ?? bank_usd_rate,
    gap_value:
      market_usd_rate && bank_usd_rate
        ? Number((market_usd_rate - bank_usd_rate).toFixed(2))
        : 0,
    history: local.history,
    updated_at: new Date().toISOString(),
  };
}

async function fetchGlobalOunce(symbol: "XAU" | "XAG") {
  const res = await fetch(`https://api.gold-api.com/price/${symbol}`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error("فشل الاتصال بمصدر السعر العالمي");
  const data: any = await res.json();
  const price = data.price ?? data.rate ?? data.value ?? null;
  if (!price) throw new Error("تعذر قراءة السعر العالمي");
  return { price: Number(price) as number, raw: data };
}

async function fetchComputedGoldPrices() {
  const [goldRes, usdRate] = await Promise.all([
    fetch("https://api.gold-api.com/price/XAU", { signal: AbortSignal.timeout(6000) }),
    safeUsdRate(50.65),
  ]);
  if (!goldRes.ok) throw new Error("فشل الاتصال بمصدر سعر الذهب العالمي");
  const goldData: any = await goldRes.json();
  const ounce_usd = goldData.price ?? goldData.rate ?? goldData.value ?? null;
  if (!ounce_usd) throw new Error("تعذر قراءة سعر الذهب");

  const bank_usd_rate = usdRate ?? 50.65;
  // سعر جرام الذهب الخالص (عيار 24، نقاء 99.9%) بالجنيه المصري
  const pureGramEgp = (ounce_usd / GRAMS_PER_OUNCE) * bank_usd_rate;
  const SPREAD = 0.0016; // فارق بيع/شراء تقريبي زي المعتاد في محلات الصاغة المصرية

  const caratPrices: Record<number, { sell: number; buy: number }> = {};
  for (const c of [24, 22, 21, 18, 14, 12]) {
    const base = pureGramEgp * GOLD_PURITY[c]!;
    caratPrices[c] = {
      sell: Math.round(base * (1 + SPREAD)),
      buy: Math.round(base * (1 - SPREAD)),
    };
  }
  const pound = { sell: caratPrices[21]!.sell * 8, buy: caratPrices[21]!.buy * 8 };

  const ounce_change_percent = goldData.chp ?? goldData.change_percent ?? null;
  const ounce_egp = {
    sell: Math.round(pureGramEgp * GRAMS_PER_OUNCE * (1 + SPREAD)),
    buy: Math.round(pureGramEgp * GRAMS_PER_OUNCE * (1 - SPREAD)),
  };

  // نفس تسجيل الأرشيف اللي في fetchLocalGoldPrices — المسار ده بيتفعّل بس لو
  // مصدر الصاغة المحلي فشل، فمن غير السطر ده كان يوم زي ده هيفضل من غير أي
  // لقطة في الأرشيف اليومي (نفس المشكلة اللي كانت في مسار الفضة).
  void recordDailySnapshotIfMissing({ caratPrices, ounce_egp, pound });

  return {
    source: "gold-api.com",
    ounce_usd,
    ounce_change_percent,
    ounce_egp,
    pound,
    caratPrices,
    bank_usd_rate,
    implied_usd_rate: bank_usd_rate,
    gap_value: 0,
    updated_at: new Date().toISOString(),
  };
}

// آخر سعر فضة عالمي (XAG) نجحنا نجيبه — بيستخدم كخط دفاع تاني لو مصدر السعر
// العالمي فشل في طلب معين (تايم أوت / رجّع خطأ)، عشان صفحة الفضة والأرشيف
// اليومي بتاعها ميقفوش تمامًا لمجرد تعثر مؤقت في مصدر خارجي واحد. نفس الفكرة
// اللي بيستخدمها مسار الذهب أصلاً (fetchGlobalOunce("XAU").catch(() => null)).
let lastKnownXagUsd: number | null = null;

async function fetchSilverPrices() {
  const [silverRes, local, usdRate] = await Promise.all([
    fetchGlobalOunce("XAG").catch(() => null),
    fetchEgyptGoldMarket().catch(() => null),
    safeUsdRate(null),
  ]);

  if (silverRes?.price) lastKnownXagUsd = silverRes.price;
  const ounce_usd = silverRes?.price ?? lastKnownXagUsd;
  if (!ounce_usd) {
    // فشل المصدر اللحظي ومفيش سعر سابق محفوظ من نفس تشغيلة السيرفر (مثلاً أول
    // طلب بعد إعادة تشغيل) — هنا فعلاً مفيش سعر نقدر نعتمد عليه، فبنرفع خطأ
    // عادي وبيتكفل بيه الكاش (cached()) برجوع آخر نسخة ناجحة لو موجودة.
    throw new Error("تعذر الحصول على سعر الفضة العالمي ولا يوجد سعر سابق محفوظ");
  }

  // سعر دولار السوق (الصاغة) هو الأقرب لتسعير الفضة في محلات مصر
  const bank_usd_rate =
    local?.market_usd_rate ?? local?.bank_usd_rate ?? usdRate ?? 50.65;
  const gramEgp = (ounce_usd / GRAMS_PER_OUNCE) * bank_usd_rate;
  const SPREAD = 0.0035;

  const silverPrices: Record<string, { sell: number; buy: number }> = {};
  for (const [carat, purity] of Object.entries(SILVER_PURITY)) {
    const base = gramEgp * purity;
    silverPrices[carat] = {
      sell: Number((base * (1 + SPREAD)).toFixed(2)),
      buy: Number((base * (1 - SPREAD)).toFixed(2)),
    };
  }

  void recordSilverSnapshotIfMissing(silverPrices);

  // نسبة التغيّر اليومي لسعر الفضة (زي اللي بيظهر جنب سعر أونصة الذهب) —
  // بتتحسب من مقارنة سعر عيار 999 النهاردة بلقطة الأمس المحفوظة في الأرشيف.
  // مفيش مصدر خارجي بيدّينا نسبة تغيّر جاهزة للفضة زي اللي عند الذهب، فبنعتمد
  // على أرشيفنا احنا بدل ما نسيب الكارت من غير أي مؤشر.
  const yesterday = await getYesterdaySilverSnapshot().catch(() => null);
  const todayRef = silverPrices["999"]?.sell ?? null;
  const ounce_change_percent =
    yesterday?.silver999_sell && todayRef
      ? Number((((todayRef - yesterday.silver999_sell) / yesterday.silver999_sell) * 100).toFixed(2))
      : null;

  return {
    source: local?.market_usd_rate
      ? "gold-api.com + gold-price-today.com"
      : "gold-api.com + banklive.net",
    ounce_usd,
    ounce_change_percent,
    bank_usd_rate,
    silverPrices,
    updated_at: new Date().toISOString(),
  };
}

// كاش فى الذاكرة: بيخلى الاستجابة أسرع وبيقدّم آخر بيانات ناجحة لو المصدر رفض الطلب
type CacheEntry = { at: number; data: any };
const memCache = new Map<string, CacheEntry>();

async function cached<T>(key: string, freshMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = memCache.get(key);
  if (hit && Date.now() - hit.at < freshMs) return hit.data as T;
  try {
    const data = await fn();
    memCache.set(key, { at: Date.now(), data });
    void reportSuccess(key); // مش هننتظرها، مبتأثرش على سرعة الرد
    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await reportFailure(key, !!hit, message); // بنستنى دي عشان التنبيه يتبعت فعلاً قبل ما نرجع الرد
    if (hit) return hit.data as T; // نرجّع آخر نسخة ناجحة بدل الخطأ
    throw e;
  }
}

export async function getCryptoPrices() {
  return cached("crypto", 45_000, fetchCryptoPrices);
}

async function fetchCryptoPrices() {
  // ملاحظة: CoinGecko بيرفض (403) طلبات جايه من Cloudflare Workers، فبنستخدم
  // CoinPaprika بدالها — مجاني وبدون مفتاح API وشغال كويس مع Cloudflare.
  const [marketsRes, usdRate] = await Promise.all([
    fetch("https://api.coinpaprika.com/v1/tickers", {
      headers: UA,
      signal: AbortSignal.timeout(8000),
    }),
    safeUsdRate(51.4),
  ]);
  if (!marketsRes.ok) {
    const bodyText = await marketsRes.text().catch(() => "");
    throw new Error(
      `تعذر الوصول لمصدر أسعار العملات الرقمية (status ${marketsRes.status}) ${bodyText.slice(0, 150)}`,
    );
  }
  const all: any = await marketsRes.json();
  if (!Array.isArray(all) || all.length === 0) {
    throw new Error("لم يتم العثور على بيانات عملات رقمية");
  }
  const markets = all
    .filter((c: any) => c.rank && c.rank <= 20)
    .sort((a: any, b: any) => a.rank - b.rank);
  const bank_usd_rate = usdRate ?? 51.4;

  const coins = markets.map((c: any) => {
    const price = c.quotes?.USD?.price ?? null;
    const change = c.quotes?.USD?.percent_change_24h ?? null;
    return {
      id: c.id,
      symbol: (c.symbol || "").toUpperCase(),
      name: c.name,
      image: null,
      price_usd: price,
      price_egp:
        typeof price === "number" ? Number((price * bank_usd_rate).toFixed(4)) : null,
      change_24h:
        typeof change === "number" ? Number(change.toFixed(2)) : null,
    };
  });

  return { source: "coinpaprika.com", bank_usd_rate, coins, updated_at: new Date().toISOString() };
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function decodeEntities(str: string) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
function extractTag(block: string, tag: string) {
  const re = new RegExp("<" + tag + "[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/" + tag + ">");
  const m = block.match(re);
  return m ? decodeEntities(m[1]!.trim()) : null;
}

export async function getNews(query = "اسعار الذهب مصر") {
  const url =
    "https://news.google.com/rss/search?q=" + encodeURIComponent(query) + "&hl=ar&gl=EG&ceid=EG:ar";
  const response = await fetch(url, { headers: UA, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("تعذر تحميل الأخبار");
  const xml = await response.text();

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]!);
  const results = items
    .map((block) => {
      let title = extractTag(block, "title") || "";
      const link = extractTag(block, "link") || "";
      const pubDate = extractTag(block, "pubDate");
      const source = extractTag(block, "source") || "خبر";
      if (source) {
        title = title.replace(new RegExp("\\s*-\\s*" + escapeRegex(source) + "$"), "");
      }
      return { title, link, source, timestamp: pubDate ? new Date(pubDate).getTime() : null };
    })
    .filter((a) => a.title && a.link);

  if (!results.length) throw new Error("لم يتم العثور على اخبار");
  results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return { source: "Google News RSS", articles: results.slice(0, 15), updated_at: new Date().toISOString() };
}


// نسخ مكشوفة بكاش (سرعة + مقاومة أعطال المصادر)
export async function getCurrencyRates() {
  return cached("currency", 60_000, fetchCurrencyRates);
}
export async function getGoldPrices() {
  return cached("gold", 30_000, fetchGoldPrices);
}
export async function getSilverPrices() {
  return cached("silver", 120_000, fetchSilverPrices);
}

// مصادر الأسعار اللحظية (ذهب / فضة / عملات / عملات رقمية / أخبار)
// كلها مصادر مجانية بدون مفاتيح API

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
  const res = await fetch("https://banklive.net/en/currencies", {
    headers: UA,
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error("تعذر الوصول لصفحة أسعار العملات");
  const text = stripTagsKeepPercent(await res.text());

  const SPREAD = 0.002;
  const rates: Record<string, { mid: number; buy: number; sell: number }> = {
    egp: { mid: 1, buy: 1, sell: 1 },
  };
  for (const [code, label] of Object.entries(CURRENCIES)) {
    const mid = extractOne(text, label);
    if (mid) {
      rates[code] = {
        mid: Number(mid.toFixed(4)),
        buy: Number((mid * (1 - SPREAD)).toFixed(4)),
        sell: Number((mid * (1 + SPREAD)).toFixed(4)),
      };
    }
  }
  if (Object.keys(rates).length < 6) throw new Error("لم يتم العثور على أسعار كافية للعملات");
  return { source: "banklive.net", rates, updated_at: new Date().toISOString() };
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
  const [pageRes, usdRate] = await Promise.all([
    fetch("https://banklive.net/en/gold-price-today-in-egypt", {
      headers: UA,
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    }),
    safeUsdRate(),
  ]);
  if (!pageRes.ok) throw new Error("تعذر الوصول لموقع أسعار الذهب");

  const rawText = stripTagsKeepPercent(await pageRes.text());
  const text = stripPercents(rawText);

  const k24 = extractPair(text, "Gold 24 Karat");
  if (!k24) throw new Error("لم يتم العثور على جدول الأسعار");

  const caratPrices: Record<number, { sell: number; buy: number }> = { 24: k24 };
  for (const [c, label] of [
    [22, "Gold 22 Karat"], [21, "Gold 21 Karat"], [18, "Gold 18 Karat"],
    [14, "Gold 14 Karat"], [12, "Gold 12 Karat"],
  ] as const) {
    const v = extractPair(text, label);
    if (v) caratPrices[c] = v;
  }
  const pound = extractPair(text, "Gold Pound");

  const unitSell = k24.sell / GOLD_PURITY[24]!;
  const unitBuy = k24.buy / GOLD_PURITY[24]!;
  for (const c of [24, 22, 21, 18, 14, 12]) {
    if (!caratPrices[c]) {
      caratPrices[c] = {
        sell: Math.round(unitSell * GOLD_PURITY[c]!),
        buy: Math.round(unitBuy * GOLD_PURITY[c]!),
      };
    }
  }

  const ounceMatch = text.match(/XAU\/USD\s*\$?\s*([\d,]+\.?\d*)/);
  const ounce_usd = ounceMatch ? parseFloat(ounceMatch[1]!.replace(/,/g, "")) : null;
  const changeMatch = rawText.match(/XAU\/USD\s*\$?\s*[\d,]+\.?\d*\s*([-+]?\d+\.?\d*)%/);
  const ounce_change_percent = changeMatch ? parseFloat(changeMatch[1]!) : null;

  const bank_usd_rate = usdRate ?? extractOne(text, "USD (Bank)");

  let implied_usd_rate: number | null = null;
  let gap_value: number | null = null;
  if (ounce_usd && bank_usd_rate) {
    const pureGramUsd = (ounce_usd / GRAMS_PER_OUNCE) * GOLD_PURITY[24]!;
    implied_usd_rate = Number((k24.sell / pureGramUsd).toFixed(2));
    gap_value = Number((implied_usd_rate - bank_usd_rate).toFixed(2));
  }

  return {
    source: "banklive.net",
    ounce_usd,
    ounce_change_percent,
    pound: pound || null,
    caratPrices,
    bank_usd_rate,
    implied_usd_rate,
    gap_value,
    updated_at: new Date().toISOString(),
  };
}

async function fetchSilverPrices() {
  const [silverRes, usdRate] = await Promise.all([
    fetch("https://api.gold-api.com/price/XAG", { signal: AbortSignal.timeout(6000) }),
    safeUsdRate(51.4),
  ]);
  if (!silverRes.ok) throw new Error("فشل الاتصال بمصدر سعر الفضة العالمي");
  const silverData: any = await silverRes.json();
  const ounce_usd = silverData.price ?? silverData.rate ?? silverData.value ?? null;
  if (!ounce_usd) throw new Error("تعذر قراءة سعر الفضة");

  const bank_usd_rate = usdRate ?? 51.4;
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

  return {
    source: "gold-api.com + banklive.net",
    ounce_usd,
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
    return data;
  } catch (e) {
    if (hit) return hit.data as T; // نرجّع آخر نسخة ناجحة بدل الخطأ
    throw e;
  }
}

export async function getCryptoPrices() {
  return cached("crypto", 45_000, fetchCryptoPrices);
}

async function fetchCryptoPrices() {
  const [marketsRes, usdRate] = await Promise.all([
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h",
      { signal: AbortSignal.timeout(8000) },
    ),
    safeUsdRate(51.4),
  ]);
  if (!marketsRes.ok) throw new Error("تعذر الوصول لمصدر أسعار العملات الرقمية");
  const markets: any = await marketsRes.json();
  if (!Array.isArray(markets) || markets.length === 0) {
    throw new Error("لم يتم العثور على بيانات عملات رقمية");
  }
  const bank_usd_rate = usdRate ?? 51.4;

  const coins = markets.map((c: any) => ({
    id: c.id,
    symbol: (c.symbol || "").toUpperCase(),
    name: c.name,
    image: c.image || null,
    price_usd: c.current_price,
    price_egp:
      typeof c.current_price === "number"
        ? Number((c.current_price * bank_usd_rate).toFixed(4))
        : null,
    change_24h:
      typeof c.price_change_percentage_24h === "number"
        ? Number(c.price_change_percentage_24h.toFixed(2))
        : null,
  }));

  return { source: "coingecko.com", bank_usd_rate, coins, updated_at: new Date().toISOString() };
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

// مصدر مجاني لأسعار الذهب المحلية في مصر (محلات الصاغة) — نفس البيانات اللي بتظهر
// في التطبيقات المصرية: أسعار العيارات بيع/شراء، الجنيه الذهب، الأونصة بالجنيه
// والدولار، ودولار الصاغة مقابل دولار البنك.

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  "Accept-Language": "ar,en;q=0.8",
};

export type Pair = { sell: number; buy: number };
export type EgyptGoldMarket = {
  karats: Record<number, Pair>;
  pound: Pair | null;
  ounce_egp: Pair | null;
  ounce_usd: number | null;
  market_usd_rate: number | null;
  bank_usd_rate: number | null;
  change_percent: number | null;
  history: { label: string; value: number }[];
};

// توحيد أشكال الألف/الهمزة والأرقام العربية عشان الاستخراج يبقى مضمون
function normalize(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

function numbersAfter(text: string, label: string, window = 120) {
  const idx = text.indexOf(label);
  if (idx === -1) return [] as number[];
  const slice = text.slice(idx + label.length, idx + label.length + window);
  return (slice.match(/\d[\d,]*(?:\.\d+)?/g) || [])
    .map((n) => parseFloat(n.replace(/,/g, "")))
    .filter((n) => !isNaN(n));
}

function pairAfter(text: string, label: string): Pair | null {
  const nums = numbersAfter(text, label).filter((n) => n > 100);
  if (nums.length < 2) return null;
  const [a, b] = [nums[0]!, nums[1]!];
  return { sell: Math.max(a, b), buy: Math.min(a, b) };
}

export function parseEgyptGold(html: string): EgyptGoldMarket {
  const full = normalize(html);
  // نبدأ من جدول الأسعار نفسه لتجنّب أرقام المقدمة والقوائم
  const start = full.indexOf("سعر الشراء");
  const text = start === -1 ? full : full.slice(start);

  const karats: Record<number, Pair> = {};
  for (const k of [24, 21, 18, 14]) {
    const p = pairAfter(text, `عيار ${k} `) || pairAfter(text, `عيار ${k}`);
    if (p && p.sell > 500 && p.sell < 100000) karats[k] = p;
  }

  const pound = pairAfter(text, "الجنيه الذهب");
  const ounce_egp = pairAfter(text, "الاونصة بالجنيه");
  const ounceUsdNums = numbersAfter(text, "الاونصة بالدولار", 60).filter((n) => n > 500);
  const usdNums = numbersAfter(text, "دولار الصاغة", 160).filter((n) => n > 5 && n < 500);

  // تغيّر السعر اليومي: مقارنة عيار 21 النهاردة بآخر يوم مسجّل قبله
  const history = [...text.matchAll(/(\d{1,2} [^:،]{3,12}): (\d[\d,]*) جنيه/g)]
    .map((m) => ({ label: m[1]!.trim(), value: parseFloat(m[2]!.replace(/,/g, "")) }))
    .filter((h) => h.value > 500);

  const today = karats[21]?.sell ?? null;
  const prev = history.length ? history[history.length - 1]!.value : null;
  const change_percent =
    today && prev && prev !== today ? Number((((today - prev) / prev) * 100).toFixed(2)) : null;

  return {
    karats,
    pound,
    ounce_egp,
    ounce_usd: ounceUsdNums[0] ?? null,
    market_usd_rate: usdNums[0] ?? null,
    bank_usd_rate: usdNums[1] ?? null,
    change_percent,
    history,
  };
}

export async function fetchEgyptGoldMarket(): Promise<EgyptGoldMarket> {
  const res = await fetch("https://egypt.gold-price-today.com/", {
    headers: UA,
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) throw new Error("تعذر الوصول لمصدر أسعار الذهب المحلية");
  const data = parseEgyptGold(await res.text());
  if (!data.karats[21] || !data.karats[24]) {
    throw new Error("لم يتم العثور على أسعار العيارات في المصدر المحلي");
  }
  return data;
}

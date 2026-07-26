// api/silver-price.js
// سعر الفضة العالمي من gold-api.com (مصدر مجاني حقيقي بدون مفتاح وبدون حد طلبات)
// وسعر الدولار الرسمي من banklive.net، وبنحسب سعر الجرام بالجنيه بنفسنا

const GRAMS_PER_OUNCE = 31.1034768;
const SILVER_PURITY = { 999: 0.999, 925: 0.925, 900: 0.900, 800: 0.800, 720: 0.720, 500: 0.500 };
const SPREAD = 0.0035; // هامش الفرق بين سعر البيع والشراء

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[-+]?\d+(?:\.\d+)?%/g, ' ')
    .replace(/\s+/g, ' ');
}

function extractOne(text, label) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const after = text.slice(idx + label.length, idx + label.length + 60);
  const nums = after.match(/[\d,]+\.?\d*/g);
  if (!nums || nums.length < 1) return null;
  const v = parseFloat(nums[0].replace(/,/g, ''));
  return isNaN(v) ? null : v;
}

module.exports = async function handler(req, res) {
  try {
    const [silverRes, goldPageRes] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAG'),
      fetch('https://banklive.net/en/gold-price-today-in-egypt', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DahabySite/1.0)' },
      }),
    ]);

    if (!silverRes.ok) {
      const body = await silverRes.text();
      throw new Error(`فشل الاتصال بمصدر سعر الفضة العالمي - Status: ${silverRes.status} - ${body}`);
    }
    const silverData = await silverRes.json();
    const ounce_usd = silverData.price ?? silverData.rate ?? silverData.value ?? null;
    if (!ounce_usd) {
      throw new Error('تعذر قراءة سعر الفضة من الاستجابة: ' + JSON.stringify(silverData));
    }

    // سعر الدولار الرسمي من نفس مصدر الذهب (banklive.net)، مع قيمة احتياطية لو فشل السحب
    let bank_usd_rate = 51.4;
    if (goldPageRes.ok) {
      const html = await goldPageRes.text();
      const text = stripTags(html);
      const rate = extractOne(text, 'USD (Bank)');
      if (rate) bank_usd_rate = rate;
    }

    const gramUsd = ounce_usd / GRAMS_PER_OUNCE;
    const gramEgp = gramUsd * bank_usd_rate;

    const silverPrices = {};
    for (const [carat, purity] of Object.entries(SILVER_PURITY)) {
      const base = gramEgp * purity;
      silverPrices[carat] = {
        sell: Number((base * (1 + SPREAD)).toFixed(2)),
        buy: Number((base * (1 - SPREAD)).toFixed(2)),
      };
    }

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

    return res.status(200).json({
      source: 'gold-api.com + banklive.net',
      ounce_usd,
      bank_usd_rate,
      silverPrices,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

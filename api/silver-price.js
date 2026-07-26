// api/silver-price.js
// يجيب أسعار الفضة اللحظية الفعلية من banklive.net - بديل عن GoldAPI.io
// مصدر مجاني بدون مفتاح API وبدون حد شهري للطلبات (حل نهائي لمشكلة "الحصة الشهرية")

const SILVER_PURITY = { 999: 0.999, 925: 0.925, 900: 0.900, 800: 0.800, 720: 0.720, 500: 0.500 };
const SPREAD = 0.0035; // الموقع بيعرض سعر واحد بس للفضة، فبنولّد هامش بيع/شراء بنفسنا

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[-+]?\d+(?:\.\d+)?%/g, ' ') // شيل نسب التغيير زي "0.09%" أو "-1.2%" بالكامل عشان متتلخبطش مع الأسعار
    .replace(/\s+/g, ' ');
}

// بيرجع أول رقم بعد التسمية (سعر الجرام بالجنيه)
function extractOne(text, label) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const after = text.slice(idx + label.length, idx + label.length + 150);
  const nums = after.match(/[\d,]+\.?\d*/g);
  if (!nums || nums.length < 1) return null;
  const v = parseFloat(nums[0].replace(/,/g, ''));
  return isNaN(v) ? null : v;
}

module.exports = async function handler(req, res) {
  try {
    const response = await fetch('https://banklive.net/en/silver-price-today-in-egypt', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DahabySite/1.0)' },
    });
    if (!response.ok) throw new Error('تعذر الوصول لموقع banklive.net');

    const html = await response.text();
    const text = stripTags(html);

    const gramEgp = {
      999: extractOne(text, 'Silver Gram Carat 99.9'),
      925: extractOne(text, 'Silver Gram Carat 92.5'),
      900: extractOne(text, 'Silver Gram Carat 900'),
      800: extractOne(text, 'Silver Gram Carat 800'),
    };

    if (!gramEgp[999]) {
      throw new Error('لم يتم العثور على جدول أسعار الفضة - شكل الموقع ممكن يكون اتغيّر');
    }

    // عيار 720 و500 مش منشورين، فبنشتقهم من الفضة الخالصة (999)
    const unitEgp = gramEgp[999] / SILVER_PURITY[999];
    if (!gramEgp[720]) gramEgp[720] = unitEgp * SILVER_PURITY[720];
    if (!gramEgp[500]) gramEgp[500] = unitEgp * SILVER_PURITY[500];

    const silverPrices = {};
    for (const carat of Object.keys(SILVER_PURITY)) {
      const base = gramEgp[carat];
      if (!base) continue;
      silverPrices[carat] = {
        sell: Number((base * (1 + SPREAD)).toFixed(2)),
        buy: Number((base * (1 - SPREAD)).toFixed(2)),
      };
    }

    const ounceMatch = text.match(/XAG\/USD\s*\$?\s*([\d,]+\.?\d*)/);
    const ounce_usd = ounceMatch ? parseFloat(ounceMatch[1].replace(/,/g, '')) : null;

    // كاش 10 دقايق - مصدر عام مجاني بدون حد طلبات
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

    return res.status(200).json({
      source: 'banklive.net',
      ounce_usd,
      silverPrices,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

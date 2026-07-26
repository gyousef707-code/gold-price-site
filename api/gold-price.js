// api/gold-price.js
// يجيب أسعار الذهب اللحظية الفعلية من banklive.net (متابعة مستمرة لأسعار محلات الذهب في مصر)
// مصدر مجاني بدون مفتاح API وبدون حد شهري للطلبات

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

// بيرجع أعلى وأقل رقم بعد التسمية (سعر البيع لك وسعر الشراء منك)
function extractPair(text, label) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const after = text.slice(idx + label.length, idx + label.length + 150);
  const nums = after.match(/[\d,]+\.?\d*/g);
  if (!nums || nums.length < 2) return null;
  const v1 = parseFloat(nums[0].replace(/,/g, ''));
  const v2 = parseFloat(nums[1].replace(/,/g, ''));
  if (isNaN(v1) || isNaN(v2)) return null;
  return { sell: Math.max(v1, v2), buy: Math.min(v1, v2) };
}

module.exports = async function handler(req, res) {
  try {
    const response = await fetch('https://banklive.net/en/gold-price-today-in-egypt', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DahabySite/1.0)' },
    });
    if (!response.ok) throw new Error('تعذر الوصول لموقع banklive.net');

    const html = await response.text();
    const text = stripTags(html);

    const k24 = extractPair(text, 'Gold 24 Karat');
    const k22 = extractPair(text, 'Gold 22 Karat');
    const k21 = extractPair(text, 'Gold 21 Karat');
    const k18 = extractPair(text, 'Gold 18 Karat');
    const k14 = extractPair(text, 'Gold 14 Karat');
    const k12 = extractPair(text, 'Gold 12 Karat');
    const pound = extractPair(text, 'Gold Pound');

    if (!k24) {
      throw new Error('لم يتم العثور على جدول الأسعار - شكل الموقع ممكن يكون اتغيّر');
    }

    const caratPrices = { 24: k24 };
    if (k22) caratPrices[22] = k22;
    if (k21) caratPrices[21] = k21;
    if (k18) caratPrices[18] = k18;
    if (k14) caratPrices[14] = k14;
    if (k12) caratPrices[12] = k12;

    // أي عيار ناقص (نادر) بنشتقه من عيار 24 بنفس نسبة النقاء
    const GOLD_PURITY = { 24: 0.999, 22: 0.916, 21: 0.875, 18: 0.750, 14: 0.583, 12: 0.500 };
    const unitSell = k24.sell / GOLD_PURITY[24];
    const unitBuy = k24.buy / GOLD_PURITY[24];
    for (const c of [24, 22, 21, 18, 14, 12]) {
      if (!caratPrices[c]) {
        caratPrices[c] = {
          sell: Math.round(unitSell * GOLD_PURITY[c]),
          buy: Math.round(unitBuy * GOLD_PURITY[c]),
        };
      }
    }

    // سعر الأونصة العالمية بالدولار
    const ounceMatch = text.match(/XAU\/USD\s*\$?\s*([\d,]+\.?\d*)/);
    const ounce_usd = ounceMatch ? parseFloat(ounceMatch[1].replace(/,/g, '')) : null;

    // كاش 10 دقايق - مصدر عام مجاني بدون حد طلبات
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

    return res.status(200).json({
      source: 'banklive.net',
      ounce_usd,
      pound: pound || null,
      caratPrices,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

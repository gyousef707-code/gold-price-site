
// api/silver-price.js
// الفضة مش منشورة عند الشعبة العامة للذهب، فبتفضل جايه من GoldAPI.io
// المفتاح بيتقرأ من متغير بيئة على Vercel، مش مكتوب في الكود ولا ظاهر للفرونت اند

const GRAMS_PER_OUNCE = 31.1034768;
const SILVER_PURITY = { 999: 0.999, 925: 0.925, 900: 0.900, 800: 0.800, 720: 0.720, 500: 0.500 };
const SPREAD = 0.0035; // هامش الفرق بين سعر البيع والشراء

module.exports = async function handler(req, res) {
  try {
    const apiKey = process.env.GOLDAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GOLDAPI_KEY غير مُعرّف في متغيرات البيئة على Vercel' });
    }

    const response = await fetch('https://www.goldapi.io/api/XAG/USD', {
      headers: { 'x-access-token': apiKey, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('فشل الاتصال بـ GoldAPI.io');

    const data = await response.json();

    const EGP_PER_USD = parseFloat(process.env.EGP_PER_USD || '51.40');
    const gramUsd = data.price / GRAMS_PER_OUNCE;
    const gramEgp = gramUsd * EGP_PER_USD;

    const silverPrices = {};
    for (const [carat, purity] of Object.entries(SILVER_PURITY)) {
      const base = gramEgp * purity;
      silverPrices[carat] = {
        sell: Number((base * (1 + SPREAD)).toFixed(2)),
        buy: Number((base * (1 - SPREAD)).toFixed(2)),
      };
    }

    // كاش 8 ساعات عشان نفضل جوه حد الـ 100 طلب/شهر بتاع الخطة المجانية
    // (8 ساعات = حوالي 90 طلب في الشهر بدل آلاف لو كل زيارة بتعمل طلب جديد)
    res.setHeader('Cache-Control', 's-maxage=28800, stale-while-revalidate=3600');

    return res.status(200).json({
      ounce_usd: data.price,
      silverPrices,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

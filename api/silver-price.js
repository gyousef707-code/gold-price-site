// api/silver-price.js
// سعر الفضة العالمي من gold-api.com (مصدر مجاني حقيقي بدون مفتاح وبدون حد طلبات)
// وسعر الدولار الرسمي من banklive.net، وبنحسب سعر الجرام بالجنيه بنفسنا

const GRAMS_PER_OUNCE = 31.1034768;
const SILVER_PURITY = { 999: 0.999, 925: 0.925, 900: 0.900, 800: 0.800, 720: 0.720, 500: 0.500 };
const SPREAD = 0.0035; // هامش الفرق بين سعر البيع والشراء

module.exports = async function handler(req, res) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;

    const [silverRes, currencyRes] = await Promise.allSettled([
      fetch('https://api.gold-api.com/price/XAG', { signal: controller.signal }),
      // بدل ما نجيب صفحة الذهب كاملة بس عشان رقم الدولار، بنستخدم الـ endpoint الداخلي
      fetch(`${baseUrl}/api/currency-price`, { signal: controller.signal }),
    ]);
    clearTimeout(timeout);

    if (silverRes.status !== 'fulfilled' || !silverRes.value.ok) {
      const body = silverRes.status === 'fulfilled' ? await silverRes.value.text() : silverRes.reason;
      throw new Error(`فشل الاتصال بمصدر سعر الفضة العالمي - ${body}`);
    }
    const silverData = await silverRes.value.json();
    const ounce_usd = silverData.price ?? silverData.rate ?? silverData.value ?? null;
    if (!ounce_usd) {
      throw new Error('تعذر قراءة سعر الفضة من الاستجابة: ' + JSON.stringify(silverData));
    }

    // سعر الدولار الرسمي من /api/currency-price، مع قيمة احتياطية لو فشل السحب
    let bank_usd_rate = 51.4;
    if (currencyRes.status === 'fulfilled' && currencyRes.value.ok) {
      try {
        const currencyData = await currencyRes.value.json();
        if (currencyData.rates?.usd?.mid) bank_usd_rate = currencyData.rates.usd.mid;
      } catch (_) {
        // نتجاهل ونفضل على القيمة الاحتياطية
      }
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

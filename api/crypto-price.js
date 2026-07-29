// api/crypto-price.js
// أعلى 20 عملة رقمية بالـ Market Cap من CoinGecko (API مجاني بدون مفتاح)
// السعر بالدولار بييجي من CoinGecko مباشرة، وسعر الجنيه بنحسبه بنفسنا
// (سعر الدولار × سعر العملة بالدولار) عشان منعتمدش على استدعاء تاني لـ CoinGecko
// بالجنيه المصري ممكن يترفض أو يترفض بريت-ليميت من غير سبب واضح لأي سيرفر خارجي

module.exports = async function handler(req, res) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${req.headers.host}`;

    const [marketsRes, currencyRes] = await Promise.allSettled([
      fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h',
        { signal: controller.signal }
      ),
      fetch(`${baseUrl}/api/currency-price`, { signal: controller.signal }),
    ]);
    clearTimeout(timeout);

    if (marketsRes.status !== 'fulfilled' || !marketsRes.value.ok) {
      throw new Error('تعذر الوصول لمصدر أسعار العملات الرقمية');
    }
    const markets = await marketsRes.value.json();
    if (!Array.isArray(markets) || markets.length === 0) {
      throw new Error('لم يتم العثور على بيانات عملات رقمية');
    }

    // سعر الدولار الرسمي من الـ endpoint الداخلي (نفس المصدر المستخدم في الذهب والفضة)
    let bank_usd_rate = 51.4; // قيمة احتياطية لو فشل السحب لأي سبب
    if (currencyRes.status === 'fulfilled' && currencyRes.value.ok) {
      try {
        const currencyData = await currencyRes.value.json();
        if (currencyData.rates?.usd?.mid) bank_usd_rate = currencyData.rates.usd.mid;
      } catch (_) {
        // نتجاهل ونفضل على القيمة الاحتياطية
      }
    }

    const coins = markets.map(c => ({
      id: c.id,
      symbol: (c.symbol || '').toUpperCase(),
      name: c.name,
      image: c.image || null,
      price_usd: c.current_price,
      price_egp: typeof c.current_price === 'number'
        ? Number((c.current_price * bank_usd_rate).toFixed(4))
        : null,
      change_24h: typeof c.price_change_percentage_24h === 'number'
        ? Number(c.price_change_percentage_24h.toFixed(2))
        : null,
    }));

    // كاش قصير (60 ثانية) عشان الاسعار تفضل قريبة من اللايف
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

    return res.status(200).json({
      source: 'coingecko.com',
      bank_usd_rate,
      coins,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

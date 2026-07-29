
// api/crypto-price.js
// أعلى 10 عملات رقمية بالـ Market Cap من CoinGecko (API مجاني بدون مفتاح وبدون حد صارم للطلبات)
// بيرجع لكل عملة: السعر بالدولار، السعر بالجنيه المصري، ونسبة التغيّر خلال 24 ساعة

module.exports = async function handler(req, res) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // الخطوة 1: أعلى 10 عملات بالـ market cap + السعر بالدولار + نسبة التغيّر
    let marketsRes;
    try {
      marketsRes = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h',
        { signal: controller.signal }
      );
    } catch (e) {
      clearTimeout(timeout);
      throw new Error('تعذر الوصول لمصدر أسعار العملات الرقمية');
    }
    if (!marketsRes.ok) throw new Error('تعذر الوصول لمصدر أسعار العملات الرقمية');
    const markets = await marketsRes.json();
    if (!Array.isArray(markets) || markets.length === 0) {
      clearTimeout(timeout);
      throw new Error('لم يتم العثور على بيانات عملات رقمية');
    }

    // الخطوة 2: نفس العملات بالظبط، بس بالجنيه المصري
    const ids = markets.map(c => c.id).join(',');
    let egpRates = {};
    try {
      const egpRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=egp`,
        { signal: controller.signal }
      );
      if (egpRes.ok) egpRates = await egpRes.json();
    } catch (e) {
      // لو فشل استعلام الجنيه، هنكمل بالدولار بس (بنحسبه من سعر الدولار احتياطيًا في الفرونت)
    }
    clearTimeout(timeout);

    const coins = markets.map(c => ({
      id: c.id,
      symbol: (c.symbol || '').toUpperCase(),
      name: c.name,
      image: c.image || null,
      price_usd: c.current_price,
      price_egp: egpRates[c.id]?.egp ?? null,
      change_24h: typeof c.price_change_percentage_24h === 'number'
        ? Number(c.price_change_percentage_24h.toFixed(2))
        : null,
    }));

    // كاش قصير (60 ثانية) عشان الاسعار تفضل قريبة من اللايف
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

    return res.status(200).json({
      source: 'coingecko.com',
      coins,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

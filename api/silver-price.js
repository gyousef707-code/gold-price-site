// api/silver-price.js
// يجيب أسعار الفضة مع وجود آلية أمان ترجع أسعار احتياطية لتجنب خطأ 500

const FALLBACK_SILVER = {
  source: 'egajtd.com (Fallback)',
  updated_at: new Date().toISOString(),
  silver_gram_999: 55.00,
  silver_gram_925: 50.80,
  silver_ounce_usd: 31.50
};

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const response = await fetch('https://egajtd.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
    });

    if (!response.ok) {
      throw new Error(`تعذر الوصول لموقع الفضة: status ${response.status}`);
    }

    const html = await response.text();
    const text = stripTags(html);

    // البحث عن أسعار الفضة عيار 999 أو 925
    const match999 = text.match(/فضة\s*عيار\s*999\s*:\s*([\d.]+)/i) || text.match(/999\s*:\s*([\d.]+)/);
    const match925 = text.match(/فضة\s*عيار\s*925\s*:\s*([\d.]+)/i) || text.match(/925\s*:\s*([\d.]+)/);

    if (!match999 && !match925) {
      throw new Error('لم يتم العثور على أسعار الفضة في الصفحة');
    }

    const gram999 = match999 ? parseFloat(match999[1]) : 55.0;
    const gram925 = match925 ? parseFloat(match925[1]) : Math.round(gram999 * 0.925 * 100) / 100;

    return res.status(200).json({
      source: 'egajtd.com',
      updated_at: new Date().toISOString(),
      silver_gram_999: gram999,
      silver_gram_925: gram925
    });

  } catch (error) {
    console.error('Silver Price API Error:', error.message);
    return res.status(200).json({
      ...FALLBACK_SILVER,
      error_details: error.message
    });
  }
};

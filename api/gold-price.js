// api/gold-price.js
// يجيب أسعار الذهب من موقع "الشعبة العامة للذهب والمجوهرات" (egajtd.com)
// مع وجود آلية أمان ترجع أسعار احتياطية في حالة تعذر السحب لتجنب خطأ 500

const FALLBACK_DATA = {
  source: 'egajtd.com (Fallback)',
  updated_at: new Date().toISOString(),
  ounce: { sell: 2750.00, buy: 2748.00 },
  prices: {
    24: { sell: 4680, buy: 4640 },
    22: { sell: 4290, buy: 4253 },
    21: { sell: 4095, buy: 4060 },
    18: { sell: 3510, buy: 3480 },
    14: { sell: 2730, buy: 2707 },
    12: { sell: 2340, buy: 2320 }
  },
  pound: { sell: 32760, buy: 32480 }
};

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

function extractPair(text, labelPattern) {
  const re = new RegExp(labelPattern + '\\s*\\$?\\s*([\\d,]+\\.?\\d*)\\s*\\$?\\s*([\\d,]+\\.?\\d*)');
  const m = text.match(re);
  if (!m) return null;
  return {
    sell: parseFloat(m[1].replace(/,/g, '')),
    buy: parseFloat(m[2].replace(/,/g, '')),
  };
}

module.exports = async function handler(req, res) {
  // ضبط الرؤوس لتجنب مشاكل CORS والتخزين المؤقت
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const response = await fetch('https://egajtd.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
    });

    if (!response.ok) {
      throw new Error(`تعذر الوصول للموقع: status ${response.status}`);
    }

    const html = await response.text();
    const text = stripTags(html);

    const ounce = extractPair(text, 'الأوقية');
    const k24 = extractPair(text, 'عيار\\s*24');
    const k21 = extractPair(text, 'عيار\\s*21');
    const k18 = extractPair(text, 'عيار\\s*18');
    const k14 = extractPair(text, 'عيار\\s*14');
    const pound = extractPair(text, 'الجني[ةه]\\s*الذهب');

    if (!k24) {
      throw new Error('لم يتم العثور على جدول الأسعار في الصفحة');
    }

    const result = {
      source: 'egajtd.com',
      updated_at: new Date().toISOString(),
      ounce: ounce || { sell: 0, buy: 0 },
      prices: {
        24: k24,
        21: k21 || { sell: Math.round(k24.sell * (21 / 24)), buy: Math.round(k24.buy * (21 / 24)) },
        18: k18 || { sell: Math.round(k24.sell * (18 / 24)), buy: Math.round(k24.buy * (18 / 24)) },
        14: k14 || { sell: Math.round(k24.sell * (14 / 24)), buy: Math.round(k24.buy * (14 / 24)) }
      },
      pound: pound || { sell: (k21 ? k21.sell : k24.sell * 0.875) * 8, buy: (k21 ? k21.buy : k24.buy * 0.875) * 8 }
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Gold Price API Error:', error.message);
    // في حالة حدوث أي خطأ، يتم إرجاع البيانات الاحتياطية بدلاً من كسر السيرفر 500
    return res.status(200).json({
      ...FALLBACK_DATA,
      error_details: error.message
    });
  }
};

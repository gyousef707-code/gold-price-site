
// api/currency-price.js
// أسعار العملات مقابل الجنيه المصري - من نفس مصدر أسعار الذهب والفضة (banklive.net/en/currencies)
// المصدر بيرجع سعر واحد (mid) لكل عملة، فبنحسب البيع والشراء بهامش بسيط حواليه

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

// بيدور على كود العملة ملزوق بـ EGP (زي USDEGP) وياخد أول رقم بعده
function extractOne(text, label) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const after = text.slice(idx + label.length, idx + label.length + 60);
  const nums = after.match(/[\d,]+\.?\d*/g);
  if (!nums || nums.length < 1) return null;
  const v = parseFloat(nums[0].replace(/,/g, ''));
  return isNaN(v) ? null : v;
}

const SPREAD = 0.002; // هامش 0.2% بين سعر البيع والشراء حوالين السعر الأساسي

const CURRENCIES = {
  usd: 'USDEGP', eur: 'EUREGP', gbp: 'GBPEGP', sar: 'SAREGP',
  aed: 'AEDEGP', kwd: 'KWDEGP', qar: 'QAREGP', bhd: 'BHDEGP',
  omr: 'OMREGP', jod: 'JODEGP', chf: 'CHFEGP', jpy: 'JPYEGP',
  cny: 'CNYEGP', try: 'TRYEGP',
};

module.exports = async function handler(req, res) {
  try {
    const response = await fetch('https://banklive.net/en/currencies', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DahabySite/1.0)' },
    });
    if (!response.ok) throw new Error('تعذر الوصول لصفحة أسعار العملات على banklive.net');

    const html = await response.text();
    const text = stripTags(html);

    const rates = { egp: { mid: 1, buy: 1, sell: 1 } };
    for (const [code, label] of Object.entries(CURRENCIES)) {
      const mid = extractOne(text, label);
      if (mid) {
        rates[code] = {
          mid: Number(mid.toFixed(4)),
          buy: Number((mid * (1 - SPREAD)).toFixed(4)),
          sell: Number((mid * (1 + SPREAD)).toFixed(4)),
        };
      }
    }

    if (Object.keys(rates).length < 6) {
      throw new Error('لم يتم العثور على أسعار كافية للعملات - شكل الموقع ممكن يكون اتغيّر');
    }

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

    return res.status(200).json({
      source: 'banklive.net',
      rates,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

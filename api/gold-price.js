
// api/gold-price.js
// يجيب أسعار الذهب من موقع "الشعبة العامة للذهب والمجوهرات" (egajtd.com) - المصدر الرسمي في مصر
// مصدر عام مفتوح، بدون مفتاح API وبدون حد شهري للطلبات

const GOLD_PURITY = { 24: 0.999, 22: 0.916, 21: 0.875, 18: 0.750, 14: 0.583, 12: 0.500 };

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
  try {
    const response = await fetch('https://egajtd.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DahabySite/1.0)' },
    });
    if (!response.ok) throw new Error('تعذر الوصول لموقع الشعبة العامة للذهب');

    const html = await response.text();
    const text = stripTags(html);

    const ounce = extractPair(text, 'الأوقية');
    const k24 = extractPair(text, 'عيار\\s*24');
    const k21 = extractPair(text, 'عيار\\s*21');
    const k18 = extractPair(text, 'عيار\\s*18');
    const k14 = extractPair(text, 'عيار\\s*14');
    const pound = extractPair(text, 'الجني[ةه]\\s*الذهب');

    if (!k24) {
      throw new Error('لم يتم العثور على جدول

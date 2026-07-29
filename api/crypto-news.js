
// api/crypto-news.js
// اخبار وتحليل يومي لكل عملة رقمية بذاتها (ليه ارتفعت / ليه انخفضت / اخر اخبارها)
// من خلاصة RSS عامة (Google News) - نفس اسلوب news.js بالظبط، بس مخصص لكل عملة براحتها

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractTag(block, tag) {
  const re = new RegExp('<' + tag + '[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/' + tag + '>');
  const m = block.match(re);
  return m ? decodeEntities(m[1].trim()) : null;
}

async function fetchFeed(query) {
  const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(query) + '&hl=ar&gl=EG&ceid=EG:ar';
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DahabySite/1.0)' } });
  if (!response.ok) throw new Error('news feed error: ' + response.status);
  const xml = await response.text();

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
  return items.map(block => {
    let title = extractTag(block, 'title') || '';
    const link = extractTag(block, 'link') || '';
    const pubDate = extractTag(block, 'pubDate');
    const source = extractTag(block, 'source') || 'خبر';
    if (source) {
      const suffix = new RegExp('\\s*-\\s*' + escapeRegex(source) + '$');
      title = title.replace(suffix, '');
    }
    const ts = pubDate ? new Date(pubDate).getTime() : null;
    return { title, link, source, timestamp: ts };
  }).filter(a => a.title && a.link);
}

module.exports = async function handler(req, res) {
  try {
    const name = (req.query.name || '').toString().trim();
    const symbol = (req.query.symbol || '').toString().trim();
    if (!name && !symbol) {
      return res.status(400).json({ error: 'اسم العملة (name) مطلوب' });
    }

    const coinLabel = name || symbol;
    // بنبحث باسم العملة + كلمة "سعر" عشان نجيب اخبار ومقالات تحليل عن حركة سعرها بالتحديد
    const results = await fetchFeed(coinLabel + ' سعر');

    if (!results.length) throw new Error('لم يتم العثور على اخبار لهذه العملة');

    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const articles = results.slice(0, 12);

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({
      source: 'Google News RSS',
      coin: coinLabel,
      articles,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

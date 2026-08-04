
// api/crypto-info.js
// معلومات تفصيلية عن عملة رقمية معينة (وصف، روابط رسمية، تاريخ الاطلاق، تصنيف)
// من CoinGecko (نفس مصدر crypto-price.js) - مجاني وبدون مفتاح API
// بيتنادى مرة واحدة بس لما المستخدم يفتح صفحة تفاصيل عملة معينة، والكاش طويل لأن البيانات دي بطيئة التغيّر

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<a\s[^>]*>/gi, '')
    .replace(/<\/a>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

module.exports = async function handler(req, res) {
  try {
    const id = (req.query.id || '').toString().trim().toLowerCase();
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      return res.status(400).json({ error: 'معرّف العملة (id) مطلوب' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}` +
        `?localization=true&tickers=false&market_data=false&community_data=true&developer_data=false&sparkline=false`,
        { signal: controller.signal }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error('تعذر الوصول لمعلومات العملة (كود ' + response.status + ')');
    }
    const data = await response.json();

    // الوصف: بنفضّل العربي لو موجود ومكتوب فعلًا، ولو مش موجود بناخد الانجليزي
    const descAr = data.description && data.description.ar;
    const descEn = data.description && data.description.en;
    const description = stripHtml(descAr && descAr.length > 20 ? descAr : descEn);

    const links = data.links || {};
    const homepage = (links.homepage || []).filter(Boolean)[0] || null;
    const whitepaper = (links.whitepaper_url || links.whitepaper) || null;
    const explorer = (links.blockchain_site || []).filter(Boolean)[0] || null;
    const forum = (links.official_forum_url || []).filter(Boolean)[0] || null;
    const github = links.repos_url && links.repos_url.github && links.repos_url.github.filter(Boolean)[0] || null;
    const subreddit = links.subreddit_url || null;
    const chatLink = (links.chat_url || []).filter(Boolean)[0] || null;

    const categories = (data.categories || []).filter(Boolean).slice(0, 4);

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');

    return res.status(200).json({
      source: 'coingecko.com',
      id: data.id,
      name: data.name,
      symbol: (data.symbol || '').toUpperCase(),
      image: data.image ? (data.image.large || data.image.small || data.image.thumb) : null,
      description: description || null,
      genesis_date: data.genesis_date || null,
      categories,
      links: {
        homepage,
        whitepaper,
        explorer,
        forum,
        github,
        subreddit,
        chat: chatLink,
      },
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

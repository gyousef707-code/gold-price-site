// Vercel Serverless Function — بينادي GoldAPI.io من السيرفر عشان المفتاح ميبقاش ظاهر في المتصفح
export default async function handler(req, res) {
  const API_KEY = process.env.GOLD_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "GOLD_API_KEY غير مُعرّف في إعدادات Vercel" });
  }

  try {
    const [usdRes, egpRes] = await Promise.all([
      fetch("https://www.goldapi.io/api/XAU/USD", {
        headers: { "x-access-token": API_KEY, Accept: "application/json" },
      }),
      fetch("https://www.goldapi.io/api/XAU/EGP", {
        headers: { "x-access-token": API_KEY, Accept: "application/json" },
      }),
    ]);

    if (!usdRes.ok || !egpRes.ok) {
      return res.status(502).json({ error: "GoldAPI رجّع خطأ — تأكد إن المفتاح صحيح ومفعّل" });
    }

    const usd = await usdRes.json();
    const egp = await egpRes.json();

    // كاش 15 دقيقة عشان نحافظ على الكوطة الشهرية المجانية
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ usd, egp });
  } catch (err) {
    return res.status(500).json({ error: "فشل الاتصال بـ GoldAPI", details: String(err) });
  }
}

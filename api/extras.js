// Vercel Serverless Function — بيجيب سعر الدولار الرسمي وتاريخ سعر الذهب الحقيقي من MetalpriceAPI
// المفتاح مخبّى في متغير بيئة، ومحدّث مرة واحدة يومياً بس عشان نفضل جوه الباقة المجانية (100 طلب/شهر)

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  const API_KEY = process.env.METAL_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "METAL_API_KEY غير مُعرّف في إعدادات Vercel" });
  }

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 1); // الـ API مش بيقبل تاريخ اليوم كـ end_date
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29); // آخر 30 يوم

  const latestUrl = `https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}&base=USD&currencies=EGP`;
  const timeframeUrl = `https://api.metalpriceapi.com/v1/timeframe?api_key=${API_KEY}&start_date=${fmtDate(
    startDate
  )}&end_date=${fmtDate(endDate)}&base=EGP&currencies=XAU`;

  try {
    const [latestRes, timeframeRes] = await Promise.all([fetch(latestUrl), fetch(timeframeUrl)]);
    const latest = await latestRes.json();
    const timeframe = await timeframeRes.json();

    if (!latest.success || !timeframe.success) {
      return res.status(502).json({ error: "MetalpriceAPI رجّع خطأ", latest, timeframe });
    }

    // نحوّل بيانات الـ timeframe لسلسلة بسيطة: تاريخ + سعر جرام 21 بالجنيه
    const history = Object.entries(timeframe.rates)
      .map(([date, r]) => ({
        date,
        gram21: r.EGPXAU ? (r.EGPXAU / 31.1035) * 0.875 : null,
      }))
      .filter((p) => p.gram21)
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // كاش 24 ساعة عشان نحافظ على الكوطة الشهرية (100 طلب بس)
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=172800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      usdEgpBankRate: latest.rates?.EGP || null,
      history,
    });
  } catch (err) {
    return res.status(500).json({ error: "فشل الاتصال بـ MetalpriceAPI", details: String(err) });
  }
}

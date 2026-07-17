// Vercel Serverless Function — بيجيب سعر الدولار الرسمي وتاريخ سعر الذهب الحقيقي من MetalpriceAPI
// ملحوظة: الباقة المجانية من MetalpriceAPI بتسمح بالعملة الأساسية USD بس (مش أي عملة تانية زي EGP)،
// فبنطلب كل حاجة بالدولار كأساس، وبنحسب سعر الجرام بالجنيه بأنفسنا من نسبة الدولار/الذهب.

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

  // كل الطلبات base=USD (الوحيد المسموح في الباقة المجانية)
  const latestUrl = `https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}&base=USD&currencies=EGP,XAU`;
  const timeframeUrl = `https://api.metalpriceapi.com/v1/timeframe?api_key=${API_KEY}&start_date=${fmtDate(
    startDate
  )}&end_date=${fmtDate(endDate)}&base=USD&currencies=EGP,XAU`;

  try {
    const [latestRes, timeframeRes] = await Promise.all([fetch(latestUrl), fetch(timeframeUrl)]);
    const latest = await latestRes.json();
    const timeframe = await timeframeRes.json();

    if (!latest.success || !timeframe.success) {
      return res.status(502).json({ error: "MetalpriceAPI رجّع خطأ", latest, timeframe });
    }

    const usdEgpBankRate = latest.rates?.EGP || null;

    // نحوّل بيانات الـ timeframe لسلسلة: تاريخ + سعر جرام عيار 21 بالجنيه
    // USDXAU = سعر أونصة الذهب بالدولار. EGP = سعر الدولار بالجنيه في نفس اليوم.
    const history = Object.entries(timeframe.rates)
      .map(([date, r]) => {
        const xauUsd = r.USDXAU; // سعر الأونصة بالدولار
        const egpRate = r.EGP; // سعر الدولار بالجنيه في نفس اليوم
        if (!xauUsd || !egpRate) return null;
        const gramUsd24 = xauUsd / 31.1035;
        const gram21EGP = gramUsd24 * 0.875 * egpRate;
        return { date, gram21: gram21EGP };
      })
      .filter(Boolean)
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // كاش 24 ساعة عشان نحافظ على الكوطة الشهرية (100 طلب بس)
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=172800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ usdEgpBankRate, history });
  } catch (err) {
    return res.status(500).json({ error: "فشل الاتصال بـ MetalpriceAPI", details: String(err) });
  }
}

// Vercel Serverless Function — بيجيب سعر الدولار الرسمي وتاريخ سعر الذهب الحقيقي من MetalpriceAPI
// ملحوظتين مهمتين عن الباقة المجانية:
// 1) الـ base لازم يكون USD بس (مش أي عملة تانية).
// 2) طلبات الـ timeframe (البيانات التاريخية) لازم تكون بعملة واحدة بس في المرة الواحدة،
//    فبنعمل نداءين منفصلين (واحد للذهب XAU وواحد للجنيه EGP) وبندمجهم بأنفسنا.
// كل قسم (سعر الدولار / الرسم البياني) مستقل عن التاني، فلو واحد فشل الباقي لسه بيشتغل.

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

async function safeFetchJson(url) {
  try {
    const r = await fetch(url);
    const j = await r.json();
    return j;
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export default async function handler(req, res) {
  const API_KEY = process.env.METAL_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "METAL_API_KEY غير مُعرّف في إعدادات Vercel" });
  }

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);
  const startStr = fmtDate(startDate);
  const endStr = fmtDate(endDate);

  const latestUrl = `https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}&base=USD&currencies=EGP`;
  const timeframeXauUrl = `https://api.metalpriceapi.com/v1/timeframe?api_key=${API_KEY}&start_date=${startStr}&end_date=${endStr}&base=USD&currencies=XAU`;
  const timeframeEgpUrl = `https://api.metalpriceapi.com/v1/timeframe?api_key=${API_KEY}&start_date=${startStr}&end_date=${endStr}&base=USD&currencies=EGP`;

  const [latest, tfXau, tfEgp] = await Promise.all([
    safeFetchJson(latestUrl),
    safeFetchJson(timeframeXauUrl),
    safeFetchJson(timeframeEgpUrl),
  ]);

  // سعر الدولار الرسمي — مستقل تماماً عن الرسم البياني
  const usdEgpBankRate = latest.success ? latest.rates?.EGP || null : null;

  // الرسم البياني — بندمج بيانات XAU وEGP لكل تاريخ مشترك
  let history = [];
  if (tfXau.success && tfEgp.success) {
    const xauRates = tfXau.rates || {};
    const egpRates = tfEgp.rates || {};
    history = Object.keys(xauRates)
      .map((date) => {
        const xauUsd = xauRates[date]?.USDXAU;
        const egpRate = egpRates[date]?.EGP;
        if (!xauUsd || !egpRate) return null;
        const gram24Usd = xauUsd / 31.1035;
        const gram21EGP = gram24Usd * 0.875 * egpRate;
        return { date, gram21: gram21EGP };
      })
      .filter(Boolean)
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }

  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=172800");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).json({
    usdEgpBankRate,
    history,
    debug: {
      latestOk: !!latest.success,
      xauOk: !!tfXau.success,
      egpOk: !!tfEgp.success,
      latestError: latest.error || null,
      xauError: tfXau.error || null,
      egpError: tfEgp.error || null,
    },
  });
}

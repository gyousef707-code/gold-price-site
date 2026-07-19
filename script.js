function fmtEGP(n) {
  return new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 0 }).format(n);
}
function fmtRate(n) {
  return new Intl.NumberFormat("ar-EG-u-nu-latn", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function fmtUSD(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

// نخزن آخر سعر أونصة بالدولار وآخر سعر دولار/جنيه معروفين، عشان نحسب بيهم سعر الجرام
// بأحدث بيانات متاحة بدل ما نعتمد على تحويل GoldAPI الداخلي اللي ممكن يكون متأخر شوية عن السوق المصري.
let latestUsdOunce = null; // سعر الأونصة بالدولار (من GoldAPI)
let latestUsdEgpRate = null; // سعر الدولار بالجنيه (من MetalpriceAPI، أحدث تحديثاً)
let latestChangePct = 0;
let latestTimestamp = null;

function renderDateNow() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });
  const timeStr = now.toLocaleTimeString("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("dateNow").textContent = `التاريخ الآن ${dateStr} — الساعة ${timeStr}`;
}

// بيحسب ويعرض كل أسعار الجرام والعيارات بناءً على أحدث سعر أونصة وأحدث سعر دولار متاحين
function renderPrices() {
  if (!latestUsdOunce || !latestUsdEgpRate) return; // لسه مفيش بيانات كفاية

  const gram24 = (latestUsdOunce / 31.1035) * latestUsdEgpRate;
  const purity = { 24: 1, 22: 0.9167, 21: 0.875, 18: 0.75, 14: 0.5833, 10: 0.4167 };
  const gram21 = gram24 * purity[21];
  const goldPound = gram21 * 8;

  document.getElementById("mainPrice").textContent = fmtEGP(gram21) + " ج.م";

  const changeEl = document.getElementById("priceChange");
  if (latestChangePct >= 0) {
    changeEl.textContent = `▲ ${latestChangePct.toFixed(2)}% منذ إغلاق أمس`;
    changeEl.className = "plate-change up";
  } else {
    changeEl.textContent = `▼ ${Math.abs(latestChangePct).toFixed(2)}% منذ إغلاق أمس`;
    changeEl.className = "plate-change down";
  }

  if (latestTimestamp) {
    document.getElementById("lastUpdated").textContent =
      "آخر تحديث: " + new Date(latestTimestamp * 1000).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit" });
  }

  const rows = document.querySelectorAll("#priceTableBody tr td:last-child");
  rows[0].textContent = fmtEGP(gram24 * purity[24]) + " ج.م";
  rows[1].textContent = fmtEGP(gram24 * purity[22]) + " ج.م";
  rows[2].textContent = fmtEGP(gram21) + " ج.م";
  rows[3].textContent = fmtEGP(gram24 * purity[18]) + " ج.م";
  rows[4].textContent = fmtEGP(gram24 * purity[14]) + " ج.م";
  rows[5].textContent = fmtEGP(gram24 * purity[10]) + " ج.م";
  rows[6].textContent = fmtEGP(goldPound) + " ج.م";
  rows[7].textContent = fmtEGP(gram24) + " ج.م";

  document.getElementById("qc21").textContent = fmtEGP(gram21);
  document.getElementById("qc24").textContent = fmtEGP(gram24 * purity[24]);
  document.getElementById("qcPound").textContent = fmtEGP(goldPound);
  document.getElementById("qcOunce").textContent = fmtEGP(gram24);
}

async function loadGoldPrice() {
  renderDateNow();
  try {
    const res = await fetch("/api/gold");
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const egp = data.egp;
    const usd = data.usd;

    latestUsdOunce = usd.price;
    latestChangePct = egp.chp || 0;
    latestTimestamp = egp.timestamp;
    // لو مفيش سعر دولار أحدث لسه، نستخدم سعر GoldAPI الداخلي مؤقتاً كبداية
    if (!latestUsdEgpRate) latestUsdEgpRate = egp.price_gram_24k / (usd.price / 31.1035);

    document.getElementById("usdOunce").textContent = "$" + fmtUSD(usd.price);
    renderPrices();
  } catch (err) {
    document.getElementById("mainPrice").textContent = "تعذّر التحميل";
    document.getElementById("lastUpdated").textContent =
      "تأكد إن الموقع منشور على Vercel ومفتاح GOLD_API_KEY مضاف في الإعدادات";
    console.error(err);
  }
}

async function loadExtras() {
  try {
    const res = await fetch("/api/extras");
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();

    if (data.usdEgpBankRate) {
      document.getElementById("usdBankRate").textContent = fmtRate(data.usdEgpBankRate) + " ج.م";
      latestUsdEgpRate = data.usdEgpBankRate; // نستخدم السعر الأحدث ده في حساب سعر الذهب كمان
      renderPrices();
    }

    if (data.history && data.history.length > 1) {
      drawChart(data.history);
      document.getElementById("chartNote").textContent =
        "بيانات حقيقية من MetalpriceAPI — تتحدث يومياً.";
    } else {
      document.getElementById("chartNote").textContent = "لا توجد بيانات كافية للرسم البياني حالياً.";
    }
  } catch (err) {
    document.getElementById("usdBankRate").textContent = "تعذّر التحميل";
    document.getElementById("chartNote").textContent =
      "تأكد إن مفتاح METAL_API_KEY مضاف في إعدادات Vercel.";
    console.error(err);
  }
}

function drawChart(history) {
  const svg = document.getElementById("priceChart");
  const values = history.map((p) => p.gram21);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 600, h = 200, pad = 10;

  const points = history.map((p, i) => {
    const x = pad + (i / (history.length - 1)) * (w - pad * 2);
    const y = h - pad - ((p.gram21 - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = "M" + points.join(" L");
  const areaPath = linePath + ` L${w - pad},${h - pad} L${pad},${h - pad} Z`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#D9B679" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#D9B679" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#areaFill)" stroke="none"/>
    <path d="${linePath}" fill="none" stroke="#D9B679" stroke-width="2"/>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  loadGoldPrice();
  loadExtras();
  setInterval(loadGoldPrice, 15 * 60 * 1000); // تحديث سعر الذهب كل 15 دقيقة
  setInterval(loadExtras, 6 * 60 * 60 * 1000); // تحديث الدولار والرسم البياني كل 6 ساعات
  setInterval(renderDateNow, 60 * 1000);
});

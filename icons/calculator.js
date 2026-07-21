function fmtEGP(n) {
  return new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 0 }).format(n);
}

const UNIT_LABELS = {
  24: { name: "ذهب عيار 24", qtyLabel: "حدد عدد الجرامات" },
  22: { name: "ذهب عيار 22", qtyLabel: "حدد عدد الجرامات" },
  21: { name: "ذهب عيار 21", qtyLabel: "حدد عدد الجرامات" },
  18: { name: "ذهب عيار 18", qtyLabel: "حدد عدد الجرامات" },
  14: { name: "ذهب عيار 14", qtyLabel: "حدد عدد الجرامات" },
  10: { name: "ذهب عيار 10", qtyLabel: "حدد عدد الجرامات" },
  pound: { name: "جنيه الذهب", qtyLabel: "حدد عدد الجنيهات" },
  ounce: { name: "أونصة الذهب", qtyLabel: "حدد عدد الأواقي" },
  silver: { name: "جرام الفضة", qtyLabel: "حدد عدد الجرامات" },
};

let unitPrices = null;

function updateCalculator() {
  if (!unitPrices) return;
  const unit = document.getElementById("calcKarat").value;
  const qty = parseFloat(document.getElementById("calcGrams").value) || 0;
  const total = qty * (unitPrices[unit] || 0);
  document.getElementById("calcResult").textContent = fmtEGP(total) + " ج.م";
  document.getElementById("calcGramsLabel").textContent = UNIT_LABELS[unit].qtyLabel;
  document.getElementById("pageTitle").textContent = "احسب سعر " + UNIT_LABELS[unit].name;
}

function updateQuantityTable() {
  if (!unitPrices) return;
  const unit = document.getElementById("calcKarat").value;
  const price = unitPrices[unit] || 0;
  document.getElementById("quantityTitle").textContent = `أسعار كميات شائعة — ${UNIT_LABELS[unit].name}`;
  const quantities = [1, 5, 10, 25, 50, 100];
  document.getElementById("quantityTableBody").innerHTML = quantities
    .map((q) => `<tr><td>${q}</td><td class="num">${fmtEGP(q * price)} ج.م</td></tr>`)
    .join("");
}

async function loadPrices() {
  try {
    const [goldRes, extrasRes] = await Promise.all([fetch("/api/gold"), fetch("/api/extras")]);
    const goldData = await goldRes.json();
    const extrasData = await extrasRes.json();

    const egp = goldData.egp;
    const purity = { 24: 1, 22: 0.9167, 21: 0.875, 18: 0.75, 14: 0.5833, 10: 0.4167 };
    const gram24 = egp.price_gram_24k;

    unitPrices = {
      24: gram24 * purity[24],
      22: gram24 * purity[22],
      21: gram24 * purity[21],
      18: gram24 * purity[18],
      14: gram24 * purity[14],
      10: gram24 * purity[10],
      pound: gram24 * purity[21] * 8,
      ounce: gram24,
      silver: extrasData.silverGramEGP || 0,
    };

    // اختار الوحدة من رابط الصفحة لو موجودة (زي calculator.html?unit=pound)
    const params = new URLSearchParams(window.location.search);
    const unitParam = params.get("unit");
    if (unitParam && UNIT_LABELS[unitParam]) {
      document.getElementById("calcKarat").value = unitParam;
    }

    updateCalculator();
    updateQuantityTable();
  } catch (err) {
    document.getElementById("calcNote").textContent =
      "تعذّر تحميل الأسعار حالياً. تأكد إن الموقع منشور على Vercel والمفاتيح مضافة صح.";
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPrices();
  document.getElementById("calcGrams").addEventListener("input", updateCalculator);
  document.getElementById("calcKarat").addEventListener("change", () => {
    updateCalculator();
    updateQuantityTable();
  });
});

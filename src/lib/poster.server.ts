// بوسترات تيليجرام (ذهب + عملات) بنفس هوية موقع ذهبي — الوضع الفاتح.
//
// الفكرة: بنبني صفحة HTML ثابتة المقاس (1080×1350) بالأسعار الحالية، وبنطلب من خدمة
// Cloudflare Browser Run (REST) تصوّرها كصورة PNG، وبعدها بتتبعت لتيليجرام كصورة.
// مفيش أي مكتبة جديدة في المشروع — مجرد fetch.
//
// متغيرات مطلوبة في إعدادات الـ Worker (Secrets):
//   CF_ACCOUNT_ID    = رقم حساب Cloudflare
//   CF_BROWSER_TOKEN = توكن API بصلاحية "Browser Rendering - Edit"
// لو مش مضبوطين، الأتمتة بترجع تلقائيًا للرسالة النصية (مفيش حاجة بتقف).

export type Pair = { sell: number | null; buy: number | null };

export type GoldPosterData = {
  g24: Pair;
  g21: Pair;
  g18: Pair;
  pound: Pair;
  ounce: number | null;
  usdBank: number | null;
  usdSagha: number | null;
  date: string;
  time: string;
};

export type CurrencyRow = {
  code: string;
  name: string;
  flag: string; // رمز العلم لموقع flagcdn (us, eu, gb ...)
  buy: number | null;
  sell: number | null;
};

export type CurrencyPosterData = {
  usd: Pair;
  sagha: number | null;
  gap: number | null;
  rows: CurrencyRow[];
  date: string;
  time: string;
};

// الأصول الخارجية (خطوط/شعار/أعلام): الافتراضي للإنتاج، ويتغيّروا في المعاينة المحلية
export type PosterAssets = {
  head: string; // وسوم <link>/<style> للخطوط
  logoUrl: string;
  flagUrl: (flag: string) => string;
};

export const defaultAssets: PosterAssets = {
  head: `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">`,
  logoUrl: "https://zahaby1.com/logo.png",
  flagUrl: (flag) => `https://flagcdn.com/w80/${flag}.png`,
};

// العملات اللي بتظهر في بوستر العملات (بالترتيب) — نفس بيانات الموقع
export const POSTER_CURRENCIES: Array<{ code: string; name: string; flag: string }> = [
  { code: "eur", name: "يورو", flag: "eu" },
  { code: "gbp", name: "جنيه استرليني", flag: "gb" },
  { code: "sar", name: "ريال سعودي", flag: "sa" },
  { code: "aed", name: "درهم إماراتي", flag: "ae" },
  { code: "kwd", name: "دينار كويتي", flag: "kw" },
];

// تاريخ ووقت القاهرة بأرقام لاتينية (زي باقي الموقع)
export function cairoDateTime(date = new Date()): { date: string; time: string } {
  return {
    date: date.toLocaleDateString("ar-EG-u-nu-latn", {
      timeZone: "Africa/Cairo",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("ar-EG-u-nu-latn", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

const num = (v: number | null | undefined, opts?: Intl.NumberFormatOptions) =>
  v == null || !Number.isFinite(v) ? "—" : Number(v).toLocaleString("en-US", opts);
const dec2 = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#0d1117;--ink2:#161b22;--bg:#f3f1ea;--card:#fff;--text:#18202a;--muted:#5d6877;--g1:#b78112;--g2:#c89522;--g3:#8d640c;--gl:#e3b341;--line:#e6dfcc;--hair:#eee9db}
html{width:1080px;height:1350px;overflow:hidden}
body{width:1080px;height:1350px;background:var(--bg);font-family:'Cairo',sans-serif;color:var(--text);position:relative;display:flex;flex-direction:column}
.gt{background:linear-gradient(135deg,var(--g1),var(--g2) 55%,var(--g3));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hd{position:relative;height:262px;background:radial-gradient(700px 360px at 12% 0%,rgba(227,179,65,.24),transparent 70%),linear-gradient(160deg,var(--ink2),var(--ink));padding:0 64px;display:flex;align-items:center;justify-content:space-between;overflow:hidden}
.hd::after{content:"";position:absolute;left:0;right:0;bottom:0;height:6px;background:linear-gradient(90deg,var(--g3),var(--gl),var(--g3))}
.hd .arc{position:absolute;width:520px;height:520px;border-radius:50%;border:1.5px solid rgba(227,179,65,.14);left:-170px;top:-250px}
.brandbox{display:flex;align-items:center;gap:26px}
.logo{width:150px;height:150px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 4px rgba(227,179,65,.55),0 0 50px rgba(227,179,65,.35)}
.bn{font-size:104px;font-weight:800;line-height:1.45;padding-bottom:4px;background:linear-gradient(135deg,#e3b341,#f6d36b 50%,#c89522);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.bs{color:#aeb7c2;font-size:27px;font-weight:600;margin-top:2px}
.meta{position:relative;direction:rtl;display:flex;flex-direction:column;align-items:flex-start;gap:14px}
.live{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.07);border:1.5px solid rgba(227,179,65,.4);color:#f6d36b;font-weight:800;font-size:26px;padding:6px 22px;border-radius:40px}
.live i{width:13px;height:13px;border-radius:50%;background:#f85149;box-shadow:0 0 12px #f85149}
.dt{color:#e6eaf0;font-size:30px;font-weight:700}
.tm{color:#aeb7c2;font-size:26px;font-weight:600}
.bd{flex:1;padding:34px 64px 0;display:flex;flex-direction:column;gap:26px}
.card{background:var(--card);border:1.5px solid var(--line);border-radius:28px;box-shadow:0 12px 36px rgba(60,45,10,.08)}
.hero{position:relative;border:2px solid var(--g2);box-shadow:0 0 0 6px rgba(200,149,34,.10),0 18px 44px rgba(60,45,10,.12);overflow:hidden}
.hero .top{display:flex;align-items:center;justify-content:space-between;padding:18px 38px;background:linear-gradient(90deg,#fbf3dc,#fffaf0);border-bottom:1.5px solid var(--line)}
.hero .ttl{display:flex;align-items:center;gap:18px;font-size:44px;font-weight:800}
.tag{background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;font-size:23px;font-weight:800;padding:2px 20px;border-radius:12px}
.cur{color:var(--muted);font-size:26px;font-weight:700}
.hero .nums{display:flex}
.hero .col{flex:1;padding:20px 38px 24px;text-align:right}
.hero .col+.col{border-inline-end:1.5px solid var(--hair)}
.hero .lb{color:var(--muted);font-size:28px;font-weight:700}
.hero .big{direction:ltr;text-align:right;font-size:112px;font-weight:800;line-height:1.2;letter-spacing:-2px;font-variant-numeric:tabular-nums}
.hero .big.buy{color:var(--text)}
.tbl{overflow:hidden}
.th,.tr{display:grid;grid-template-columns:1.25fr 1fr 1fr;align-items:center;padding:0 38px}
.th{height:62px;background:#faf6ea;border-bottom:1.5px solid var(--line);color:var(--muted);font-size:27px;font-weight:800}
.th div:not(:first-child){text-align:center}
.tr{height:100px}
.tr+.tr{border-top:1.5px solid var(--hair)}
.c-l{display:flex;align-items:center;gap:18px;font-size:44px;font-weight:800}
.ring{width:20px;height:20px;border-radius:50%;border:5px solid var(--g2)}
.em{font-size:38px}
.c-n{direction:ltr;text-align:center;font-size:52px;font-weight:800;font-variant-numeric:tabular-nums}
.c-n.buy{color:var(--text)}
.c-n.sell{background:linear-gradient(135deg,var(--g1),var(--g2) 55%,var(--g3));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.stats{display:grid;gap:20px}
.st{padding:20px 26px;height:146px}
.st .t{color:var(--muted);font-size:25px;font-weight:700}
.st .v{direction:ltr;text-align:right;font-size:50px;font-weight:800;line-height:1.3;margin-top:6px;font-variant-numeric:tabular-nums}
.st .v small{font-size:22px;color:var(--muted);font-weight:700;margin-inline-start:8px}
.ft{height:118px;margin-top:28px;background:linear-gradient(160deg,var(--ink2),var(--ink));padding:0 64px;display:flex;align-items:center;justify-content:space-between;position:relative}
.ft::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,var(--g3),var(--gl),var(--g3))}
.fl{display:flex;align-items:center;gap:16px;direction:ltr;color:#f6d36b;font-size:36px;font-weight:800}
.fl .sep{width:2px;height:40px;background:rgba(227,179,65,.4)}
.fn{color:#aeb7c2;font-size:25px;font-weight:600}
/* بوستر العملات */
.fx .hero .top{padding:10px 38px}
.fx .hero .ttl{font-size:40px}
.fx .hero .big{font-size:84px}
.fx .hero .col{padding:12px 38px 16px}
.fx .tr{height:80px}
.fx .th{height:56px}
.fx .st{height:118px;padding:14px 26px;flex-shrink:0}
.fx .st .v{font-size:44px;margin-top:2px}
.bd>*{flex-shrink:0}
.flag{width:62px;height:46px;border-radius:8px;object-fit:cover;border:1.5px solid var(--line);box-shadow:0 2px 8px rgba(0,0,0,.12)}
.fx .c-l{font-size:38px;gap:20px}
.fx .c-n{font-size:46px}
.hero .flag{width:70px;height:52px}
`;

function shell(assets: PosterAssets, bodyClass: string, d: { date: string; time: string }, inner: string): string {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${assets.head}<style>${BASE_CSS}</style></head><body class="${bodyClass}">
<div class="hd"><div class="arc"></div>
  <div class="brandbox"><img class="logo" src="${assets.logoUrl}"><div><div class="bn">ذهبي</div><div class="bs">أسعار الذهب والعملات لحظة بلحظة</div></div></div>
  <div class="meta"><div class="live"><i></i>مباشر</div><div class="dt">${d.date}</div><div class="tm">آخر تحديث: ${d.time}</div></div>
</div>
${inner}
<div class="ft"><div class="fn">تابعنا للحصول على التحديثات أولًا بأول</div><div class="fl"><span>zahaby1.com</span><span class="sep"></span><span>t.me/zahaby1</span></div></div>
</body></html>`;
}

export function goldPosterHtml(d: GoldPosterData, assets: PosterAssets = defaultAssets): string {
  const tr = (label: string, p: Pair, emoji?: string) => `
    <div class="tr">
      <div class="c-l">${emoji ? `<span class="em">${emoji}</span>` : '<span class="ring"></span>'}${label}</div>
      <div class="c-n buy">${num(p.buy)}</div>
      <div class="c-n sell">${num(p.sell)}</div>
    </div>`;
  const inner = `<div class="bd">
  <div class="card hero">
    <div class="top"><div class="ttl">عيار 21 <span class="tag">الأكثر تداولًا</span></div><div class="cur">جنيه مصري</div></div>
    <div class="nums">
      <div class="col"><div class="lb">سعر الشراء</div><div class="big buy">${num(d.g21.buy)}</div></div>
      <div class="col"><div class="lb">سعر البيع</div><div class="big gt">${num(d.g21.sell)}</div></div>
    </div>
  </div>
  <div class="card tbl">
    <div class="th"><div>الذهب بالجنيه المصري</div><div>شراء</div><div>بيع</div></div>
    ${tr("عيار 24", d.g24)}
    ${tr("عيار 18", d.g18)}
    ${tr("جنيه الذهب", d.pound, "💎")}
  </div>
  <div class="stats" style="grid-template-columns:1.25fr 1fr 1fr">
    <div class="card st"><div class="t">الأونصة بالدولار</div><div class="v gt">$${num(d.ounce, dec2)}</div></div>
    <div class="card st"><div class="t">دولار البنك</div><div class="v">${num(d.usdBank, dec2)}<small>جنيه</small></div></div>
    <div class="card st"><div class="t">دولار الصاغة</div><div class="v">${num(d.usdSagha, dec2)}<small>جنيه</small></div></div>
  </div>
</div>`;
  return shell(assets, "", d, inner);
}

export function currencyPosterHtml(d: CurrencyPosterData, assets: PosterAssets = defaultAssets): string {
  const row = (r: CurrencyRow) => `
    <div class="tr">
      <div class="c-l"><img class="flag" src="${assets.flagUrl(r.flag)}">${r.name}</div>
      <div class="c-n buy">${num(r.buy, dec2)}</div>
      <div class="c-n sell">${num(r.sell, dec2)}</div>
    </div>`;
  const gap =
    d.gap == null ? "—" : `${d.gap > 0 ? "+" : d.gap < 0 ? "−" : ""}${num(Math.abs(d.gap), dec2)}`;
  const inner = `<div class="bd">
  <div class="card hero">
    <div class="top"><div class="ttl"><img class="flag" src="${assets.flagUrl("us")}">الدولار الأمريكي <span class="tag">دولار البنك</span></div><div class="cur">جنيه مصري</div></div>
    <div class="nums">
      <div class="col"><div class="lb">سعر الشراء</div><div class="big buy">${num(d.usd.buy, dec2)}</div></div>
      <div class="col"><div class="lb">سعر البيع</div><div class="big gt">${num(d.usd.sell, dec2)}</div></div>
    </div>
  </div>
  <div class="stats" style="grid-template-columns:1fr 1fr">
    <div class="card st"><div class="t">دولار الصاغة (السوق)</div><div class="v gt">${num(d.sagha, dec2)}<small>جنيه</small></div></div>
    <div class="card st"><div class="t">الفجوة بين السوق والبنك</div><div class="v">${gap}<small>جنيه</small></div></div>
  </div>
  <div class="card tbl">
    <div class="th"><div>العملات مقابل الجنيه</div><div>شراء</div><div>بيع</div></div>
    ${d.rows.map(row).join("")}
  </div>
</div>`;
  return shell(assets, "fx", d, inner);
}

// ---------------- التصوير عبر Cloudflare Browser Run ----------------
export async function renderPosterPng(html: string): Promise<Uint8Array> {
  const accountId = process.env["CF_ACCOUNT_ID"];
  const token = process.env["CF_BROWSER_TOKEN"];
  if (!accountId || !token) throw new Error("poster-not-configured");

  const body = JSON.stringify({
    html,
    viewport: { width: 1080, height: 1350, deviceScaleFactor: 1 },
    gotoOptions: { waitUntil: "networkidle0", timeout: 20000 },
    screenshotOptions: { type: "png" },
  });
  const call = (path: string) =>
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/${path}/screenshot`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(30000),
    });

  // الاسم الحالي في وثائق Cloudflare "browser-run"، والقديم "browser-rendering"
  let res = await call("browser-run");
  if (!res.ok && res.status !== 429) {
    const first = await res.text().catch(() => "");
    const res2 = await call("browser-rendering");
    if (res2.ok) res = res2;
    else {
      const t = await res2.text().catch(() => "");
      throw new Error(`poster-render-failed:${res.status}/${res2.status}:${first.slice(0, 80)}|${t.slice(0, 80)}`);
    }
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`poster-render-failed:${res.status}:${t.slice(0, 120)}`);
  }
  if (!(res.headers.get("content-type") ?? "").startsWith("image/")) {
    throw new Error("poster-render-failed:not-an-image");
  }
  return new Uint8Array(await res.arrayBuffer());
}

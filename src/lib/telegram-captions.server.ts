// نصوص "ماذا حدث وما التغيّرات" اللي بتتكتب تحت البوستر (بدل ما نكرر الأسعار).
// دوال صافية (من غير إنترنت أو قاعدة بيانات) عشان تتختبر بسهولة.
//
// ملاحظة: النص مرتبط بحدود تيليجرام — الـ caption أقصاه 1024 حرف، فبنحافظ على
// القصر. الأسعار الكاملة موجودة في الصورة نفسها.

const RLM = "‏";
const rtl = (s: string) => `${RLM}${s}`;
const b = (s: string) => `<b>${s}</b>`;

const MINUS = "−"; // علامة ناقص حقيقية (بتظهر أوضح من الشرطة)
export const fmtN = (n: number, digits = 0) =>
  Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (n: number, digits = 0) =>
  `${n > 0 ? "+" : n < 0 ? MINUS : ""}${fmtN(n, digits)}`;
const pctOf = (from: number, to: number) => ((to - from) / from) * 100;

function groups(gs: Array<Array<string | null>>): string {
  return gs
    .map((g) => g.filter((l): l is string => l !== null).map(rtl))
    .filter((g) => g.length > 0)
    .map((g) => g.join("\n"))
    .join("\n\n");
}

export type GoldSnap = Partial<
  Record<"gold24" | "gold21" | "gold18" | "gold_pound" | "ounce_usd" | "usd_bank" | "usd_sagha", number>
>;
export type DayRange = { open: number; high: number; low: number } | null;

export type Links = { site: string; channel: string };
const linkGroups = (l: Links): Array<Array<string | null>> => [
  [`🌐 موقعنا الإلكتروني: ${l.site}`],
  [`📢 قناتنا على تليجرام: ${l.channel}`],
];

// ---------------- الذهب (الرسالة اللحظية) ----------------
// جسم النص بدون روابط (بيتستخدم كمان في الرسالة النصية الاحتياطية)
export function goldNarrative(cur: GoldSnap, prev: GoldSnap, range: DayRange): string {
  const c21 = cur.gold21;
  const p21 = prev.gold21;

  const head: Array<string | null> = [];
  let direction = 0;
  if (c21 != null && p21 != null && c21 !== p21) {
    direction = c21 > p21 ? 1 : -1;
    const d = c21 - p21;
    head.push(b(direction > 0 ? "📈 الذهب يرتفع" : "📉 الذهب ينخفض"));
    head.push(
      `عيار 21 ${direction > 0 ? "ارتفع" : "انخفض"} ${fmtN(d)} جنيهًا (${signed(pctOf(p21, c21), 2)}%) منذ آخر تحديث`,
    );
  } else {
    head.push(b("🔔 تحديث في أسعار الذهب"));
    head.push("الأسعار الكاملة في الصورة.");
  }

  // منذ افتتاح اليوم + نطاق اليوم
  const day: Array<string | null> = [];
  if (range && c21 != null && range.open > 0) {
    day.push(`📅 منذ افتتاح اليوم: ${signed(c21 - range.open)} جنيه (${signed(pctOf(range.open, c21), 2)}%)`);
  }

  // الأسواق: الأونصة ودولار الصاغة، وهل باقي العيارات تحرّكت بنفس الاتجاه
  const mk: Array<string | null> = [];
  const lines: string[] = [];
  if (cur.ounce_usd != null && prev.ounce_usd != null) {
    const p = pctOf(prev.ounce_usd, cur.ounce_usd);
    lines.push(
      Math.abs(p) >= 0.1
        ? `الأونصة عالميًا ${cur.ounce_usd > prev.ounce_usd ? "ارتفعت" : "انخفضت"} ${fmtN(cur.ounce_usd - prev.ounce_usd, 2)}$ (${signed(p, 2)}%)`
        : "الأونصة عالميًا شبه مستقرة",
    );
  }
  if (cur.usd_sagha != null && prev.usd_sagha != null) {
    const d = cur.usd_sagha - prev.usd_sagha;
    lines.push(
      Math.abs(d) >= 0.05
        ? `دولار الصاغة ${d > 0 ? "ارتفع" : "انخفض"} ${fmtN(d, 2)} جنيه`
        : "دولار الصاغة شبه مستقر",
    );
  }
  if (direction !== 0) {
    const others = (["gold24", "gold18", "gold_pound"] as const).map((k) =>
      cur[k] != null && prev[k] != null ? Math.sign((cur[k] as number) - (prev[k] as number)) : 0,
    );
    if (others.every((s) => s === direction)) {
      lines.push("وتحرّكت بقية العيارات وجنيه الذهب في نفس الاتجاه");
    }
  }
  if (lines.length) {
    mk.push(b("🌍 في الأسواق"));
    mk.push(...lines.map((l) => `▫️ ${l}`));
  }

  return groups([head, day, mk]);
}

export function goldCaption(cur: GoldSnap, prev: GoldSnap, range: DayRange, links: Links): string {
  return `${goldNarrative(cur, prev, range)}\n\n${groups(linkGroups(links))}`;
}

// ---------------- العملات (رسالة أول الصباح) ----------------
export type CcySnap = Partial<
  Record<"usd" | "sagha" | "gap" | "eur" | "gbp" | "sar" | "aed" | "kwd", number>
>;

const CCY_NAMES: Record<string, string> = {
  eur: "اليورو",
  gbp: "الاسترليني",
  sar: "الريال السعودي",
  aed: "الدرهم الإماراتي",
  kwd: "الدينار الكويتي",
};

export function currencyNarrative(cur: CcySnap, prev: CcySnap | null): string {
  const head = [b("🌅 صباح الخير — افتتاح سوق العملات")];
  if (!prev) {
    return groups([head, ["هذه أسعار افتتاح اليوم، والتفاصيل كاملة في الصورة."]]);
  }

  const moved = (label: string, from?: number, to?: number): string | null => {
    if (from == null || to == null) return null;
    const d = to - from;
    if (Math.abs(d) < 0.01) return `${label}: مستقر عن إغلاق أمس`;
    return `${label}: ${d > 0 ? "ارتفع" : "انخفض"} ${fmtN(d, 2)} جنيه (${signed(pctOf(from, to), 2)}%) عن إغلاق أمس`;
  };

  const usd: Array<string | null> = [
    moved("💵 الدولار (البنك)", prev.usd, cur.usd),
    moved("💵 دولار الصاغة", prev.sagha, cur.sagha),
  ];

  if (cur.gap != null && prev.gap != null) {
    const wider = Math.abs(cur.gap) - Math.abs(prev.gap);
    usd.push(
      Math.abs(wider) >= 0.02
        ? `↔️ الفجوة بين الصاغة والبنك ${wider > 0 ? "اتسعت" : "ضاقت"} إلى ${fmtN(cur.gap, 2)} جنيه`
        : `↔️ الفجوة بين الصاغة والبنك مستقرة عند ${fmtN(cur.gap, 2)} جنيه`,
    );
  }

  const movers = (Object.keys(CCY_NAMES) as Array<keyof typeof CCY_NAMES & keyof CcySnap>)
    .map((k) => {
      const from = prev[k];
      const to = cur[k];
      return from != null && to != null ? { k, p: pctOf(from, to) } : null;
    })
    .filter((m): m is { k: keyof CcySnap; p: number } => m !== null && Math.abs(m.p) >= 0.1)
    .sort((a, z) => Math.abs(z.p) - Math.abs(a.p))
    .slice(0, 3);

  const others: Array<string | null> = [
    movers.length
      ? `🔸 أبرز التحركات: ${movers.map((m) => `${CCY_NAMES[m.k as string]} ${signed(m.p, 2)}%`).join(" • ")}`
      : "🔸 باقي العملات شبه مستقرة",
  ];

  return groups([head, usd, others]);
}

export function currencyCaption(cur: CcySnap, prev: CcySnap | null, links: Links): string {
  return `${currencyNarrative(cur, prev)}\n\n${groups(linkGroups(links))}`;
}

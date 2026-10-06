// أتمتة تيليجرام: رسالة لحظية ذكية + ملخص إغلاق يومي.
//
// بديل الـ cron الساعي القديم (كان بيبعت رسالة ثابتة كل ساعة حتى لو السعر ما اتغيرش):
//  1) الفحص اللحظي: بيشتغل من /api/push/check (اللي أصلاً بيتنده كل دقيقة)، ولا
//     يبعت غير لو سعر عيار 21 اتغير بمقدار THRESHOLD_EGP جنيه أو أكتر عن آخر
//     رسالة اتبعتت فعلاً (مش عن آخر فحص).
//  2) الإيقاف الليلي: مفيش أي إرسال لحظي خارج [OPEN_HOUR, CLOSE_HOUR) بتوقيت القاهرة.
//  3) ملخص الإغلاق: أول فحص بعد CLOSE_HOUR بيبعت ملخص اليوم مرة واحدة بس.
//
// التخزين: Cloudflare D1 (الـ binding اسمه DB — شوف wrangler.toml و migrations/).
// لو الـ binding مش مضبوط، الأتمتة بتتجاهل نفسها بهدوء ومبتأثرش على باقي الموقع.

import { sendTelegramMessage, sendTelegramPhoto } from "./telegram.server";
import { sendWhatsAppMessage } from "./whatsapp.server";
import {
  cairoDateTime,
  currencyPosterHtml,
  goldPosterHtml,
  POSTER_CURRENCIES,
  renderPosterPng,
  type CurrencyPosterData,
  type GoldPosterData,
  type Pair,
  type PosterAssets,
} from "./poster.server";
import {
  currencyCaption,
  currencyNarrative,
  goldCaption,
  goldNarrative,
  type CcySnap,
  type DayRange,
  type GoldSnap,
} from "./telegram-captions.server";

// ---------------- الإعدادات (عدّل من هنا بس) ----------------
export const TG_CONFIG = {
  TZ: "Africa/Cairo",
  OPEN_HOUR: 9, // بداية الإرسال اللحظي وتسجيل الافتتاح (ساعة بتوقيت القاهرة)
  CLOSE_HOUR: 23, // نهاية الإرسال اللحظي + إرسال ملخص اليوم (23 = 11 مساءً)
  THRESHOLD_EGP: 5, // الحد الأدنى للتغيّر عن آخر رسالة
  MAIN_ITEM: "gold21", // الصنف الذي يحدد الإرسال اللحظي
  SITE_URL: "https://zahaby1.com",
  CHANNEL_URL: "https://t.me/zahaby1",
} as const;

// ---------------- أنواع D1 (الحد الأدنى اللازم) ----------------
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
};
export type D1Like = {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
};

export type Deps = {
  db?: D1Like | null;
  now?: { day: string; hour: number };
  nowDate?: Date; // لتثبيت التاريخ/الوقت في البوستر (للاختبار)
  send?: (text: string) => Promise<unknown>;
  sendWhatsApp?: (text: string) => Promise<unknown>;
  renderPng?: (html: string) => Promise<Uint8Array>;
  sendPhoto?: (png: Uint8Array, caption: string) => Promise<unknown>;
  assets?: PosterAssets;
  force?: boolean; // اختبار يدوي: ابعت الملخص حتى لو اتبعت النهارده (من غير ما يلمس العلامة)
};

async function getDb(): Promise<D1Like | null> {
  try {
    // نفس أسلوب market.server.ts مع KV: استيراد وقت التشغيل عشان بيئة التطوير
    // المحلية (اللي معندهاش cloudflare:workers) تفضل شغالة.
    const { env } = await import("cloudflare:workers");
    return ((env as any)?.DB as D1Like | undefined) ?? null;
  } catch {
    return null;
  }
}

// ---------------- الوقت (بتوقيت القاهرة مع مراعاة التوقيت الصيفي) ----------------
export function cairoNow(date = new Date()): { day: string; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TG_CONFIG.TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return {
    day: `${parts["year"]}-${parts["month"]}-${parts["day"]}`,
    hour: Number(parts["hour"]),
  };
}

// ---------------- استخراج الأسعار ----------------
export const ITEMS = [
  "gold24",
  "gold21",
  "gold18",
  "gold_pound",
  "ounce_usd",
  "usd_bank",
  "usd_sagha",
] as const;
export type ItemKey = (typeof ITEMS)[number];

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;

export function extractPrices(gold: any, currency: any): Partial<Record<ItemKey, number>> {
  const raw: Record<ItemKey, unknown> = {
    gold24: gold?.caratPrices?.["24"]?.sell,
    gold21: gold?.caratPrices?.["21"]?.sell,
    gold18: gold?.caratPrices?.["18"]?.sell,
    gold_pound: gold?.pound?.sell,
    ounce_usd: gold?.ounce_usd,
    usd_bank: currency?.rates?.usd?.sell,
    usd_sagha: gold?.implied_usd_rate,
  };
  const out: Partial<Record<ItemKey, number>> = {};
  for (const k of ITEMS) {
    const v = raw[k];
    if (isNum(v)) out[k] = v;
  }
  return out;
}

// ---------------- تنسيق الرسائل ----------------
// RLM في أول كل سطر: بيضمن إن الإيموجي يفضل على أقصى اليمين على كل الأجهزة
const RLM = "‏";
const rtl = (s: string) => `${RLM}${s}`;
const fmt = (n: number, opts?: Intl.NumberFormatOptions) => Number(n).toLocaleString("en-US", opts);
const fmt2 = (n: number) => fmt(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// مجموعات الأسطر بينها سطر فارغ؛ المجموعة الفاضية بتتشال، والسطر الناقص بيتشال.
// lineSep: "\n" لأسطر متلاصقة، "\n\n" لسطر فارغ بين كل سطرين (مسافات أوسع)
function joinGroups(groups: Array<Array<string | null>>, lineSep = "\n"): string {
  return groups
    .map((g) => g.filter((l): l is string => l !== null).map(rtl))
    .filter((g) => g.length > 0)
    .map((g) => g.join(lineSep))
    .join("\n\n");
}

// تيليجرام ما بيدعمش تكبير الخط، فبنستخدم الخط العريض <b> للأرقام عشان تتميز
const b = (s: string) => `<b>${s}</b>`;
const DIVIDER = "➖➖➖➖➖➖➖➖➖➖";

export function formatInstant(gold: any, currency: any): string {
  const c = (k: string) => gold?.caratPrices?.[k];
  const line = (emoji: string, label: string, v: unknown, unit = "", f = fmt) =>
    isNum(v) ? `${emoji} ${label}:  ${b(f(v))}${unit ? ` ${unit}` : ""}` : null;
  const fmtOunce = (n: number) =>
    fmt(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // سطر فارغ بين كل سطرين داخل المجموعة + خط فاصل بين الأقسام
  return joinGroups(
    [
      [`${b("✨ أسعار الذهب الآن ✨")}\n${rtl(DIVIDER)}`],
      [
        line("💍", "عيار 24", c("24")?.sell, "جنيه"),
        line("💍", "عيار 21", c("21")?.sell, "جنيه"),
        line("💍", "عيار 18", c("18")?.sell, "جنيه"),
      ],
      [DIVIDER],
      [
        line("💎", "جنيه الذهب", gold?.pound?.sell, "جنيه"),
        line("📊", "الأونصة بالدولار", gold?.ounce_usd, "دولار", fmtOunce),
      ],
      [DIVIDER],
      [
        line("🌟", "سعر الشراء", c("21")?.buy, "جنيه"),
        line("🌟", "سعر البيع", c("21")?.sell, "جنيه"),
      ],
      [DIVIDER],
      [
        line("💵", "سعر الدولار", currency?.rates?.usd?.sell, "جنيه", fmt2),
        line("💵", "دولار الصاغة", gold?.implied_usd_rate, "جنيه", fmt2),
      ],
      [DIVIDER],
      [`🌐 موقعنا الإلكتروني: ${TG_CONFIG.SITE_URL}`],
      [`📢 قناتنا على تليجرام: ${TG_CONFIG.CHANNEL_URL}`],
    ],
    "\n\n",
  );
}

type StatRow = { item: string; open: number; high: number; low: number; close: number };

const SUMMARY_LABELS: Array<{ key: ItemKey; label: string; decimals: number }> = [
  { key: "gold24", label: "💍 عيار 24", decimals: 0 },
  { key: "gold21", label: "💍 عيار 21", decimals: 0 },
  { key: "gold18", label: "💍 عيار 18", decimals: 0 },
  { key: "gold_pound", label: "💎 جنيه الذهب", decimals: 0 },
  { key: "ounce_usd", label: "📊 الأونصة بالدولار", decimals: 2 },
  { key: "usd_bank", label: "💵 سعر الدولار", decimals: 2 },
  { key: "usd_sagha", label: "💵 دولار الصاغة", decimals: 2 },
];

export function formatSummary(day: string, rows: StatRow[]): string {
  const byItem = new Map(rows.map((r) => [r.item, r]));
  const date = new Date(`${day}T12:00:00Z`).toLocaleDateString("ar-EG", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const blocks = SUMMARY_LABELS.flatMap(({ key, label, decimals }) => {
    const r = byItem.get(key);
    if (!r) return [];
    const f = (n: number) =>
      fmt(n, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return [
      [
        b(label),
        `🟢 الافتتاح: ${b(f(r.open))}   🔴 الإغلاق: ${b(f(r.close))}`,
        `⬆️ الأعلى: ${b(f(r.high))}   ⬇️ الأقل: ${b(f(r.low))}`,
      ],
    ];
  });

  return joinGroups([
    [b("🌙 ملخص تداولات اليوم 🌙"), `📅 ${date}`, DIVIDER],
    ...blocks.flatMap((blk) => [blk, [DIVIDER]]),
    [`🌐 موقعنا الإلكتروني: ${TG_CONFIG.SITE_URL}`],
    [`📢 قناتنا على تليجرام: ${TG_CONFIG.CHANNEL_URL}`],
  ]);
}

// ---------------- التخزين ----------------
// UPSERT واحد لكل صنف. شرط WHERE close != excluded.close معناه: لو السعر ما اتغيرش
// مفيش كتابة خالص على D1 (بيوفر عدد الكتابات المجانية).
const UPSERT_SQL = `
INSERT INTO daily_stats (day, item, open, high, low, close, updated_at)
VALUES (?1, ?2, ?3, ?3, ?3, ?3, ?4)
ON CONFLICT(day, item) DO UPDATE SET
  high = MAX(high, excluded.high),
  low = MIN(low, excluded.low),
  close = excluded.close,
  updated_at = excluded.updated_at
WHERE close != excluded.close`;

export async function recordStats(
  db: D1Like,
  day: string,
  prices: Partial<Record<ItemKey, number>>,
) {
  const entries = Object.entries(prices) as Array<[ItemKey, number]>;
  if (!entries.length) return;
  const now = Date.now();
  const stmt = db.prepare(UPSERT_SQL);
  await db.batch(entries.map(([item, price]) => stmt.bind(day, item, price, now)));
}

// ---------------- لقطات الأسعار (لحساب "ماذا تغيّر") ----------------
// كلها best-effort: لو جدول snapshots لسه متعملش (migration 0002)، بنكمل من غير مقارنات.
async function loadSnap<T>(db: D1Like, key: string): Promise<T | null> {
  try {
    const row = await db.prepare("SELECT json FROM snapshots WHERE key = ?1").bind(key).first<{ json: string }>();
    return row ? (JSON.parse(row.json) as T) : null;
  } catch {
    return null;
  }
}

async function saveSnap(db: D1Like, key: string, value: unknown) {
  try {
    await db
      .prepare(
        "INSERT INTO snapshots (key, json, at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET json = excluded.json, at = excluded.at",
      )
      .bind(key, JSON.stringify(value), Date.now())
      .run();
  } catch {
    // مش مشكلة — بس المقارنة الجاية هتكون ناقصة
  }
}

async function loadLatestCcySnapBefore(db: D1Like, day: string): Promise<CcySnap | null> {
  try {
    const row = await db
      .prepare("SELECT json FROM snapshots WHERE key LIKE 'ccy:%' AND key < ?1 ORDER BY key DESC LIMIT 1")
      .bind(`ccy:${day}`)
      .first<{ json: string }>();
    return row ? (JSON.parse(row.json) as CcySnap) : null;
  } catch {
    return null;
  }
}

function ccySnap(gold: any, currency: any): CcySnap {
  const out: CcySnap = {};
  const put = (k: keyof CcySnap, v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  };
  const r = currency?.rates ?? {};
  put("usd", r["usd"]?.mid);
  put("sagha", gold?.implied_usd_rate);
  put("gap", gold?.gap_value);
  for (const c of POSTER_CURRENCIES) put(c.code as keyof CcySnap, r[c.code]?.mid);
  return out;
}

// ---------------- بيانات البوسترات ----------------
const pair = (x: any): Pair => ({
  sell: isNum(x?.sell) ? x.sell : null,
  buy: isNum(x?.buy) ? x.buy : null,
});

function goldPosterData(gold: any, currency: any, dt: { date: string; time: string }): GoldPosterData {
  return {
    g24: pair(gold?.caratPrices?.["24"]),
    g21: pair(gold?.caratPrices?.["21"]),
    g18: pair(gold?.caratPrices?.["18"]),
    pound: pair(gold?.pound),
    ounce: isNum(gold?.ounce_usd) ? gold.ounce_usd : null,
    usdBank: isNum(currency?.rates?.usd?.sell) ? currency.rates.usd.sell : null,
    usdSagha: isNum(gold?.implied_usd_rate) ? gold.implied_usd_rate : null,
    ...dt,
  };
}

function currencyPosterData(gold: any, currency: any, dt: { date: string; time: string }): CurrencyPosterData {
  const rates = currency?.rates ?? {};
  return {
    usd: pair(rates["usd"]),
    sagha: isNum(gold?.implied_usd_rate) ? gold.implied_usd_rate : null,
    gap: typeof gold?.gap_value === "number" ? gold.gap_value : null,
    rows: POSTER_CURRENCIES.map((c) => ({ ...c, ...pair(rates[c.code]) })).filter(
      (r) => r.buy !== null || r.sell !== null,
    ),
    ...dt,
  };
}

// ---------------- الإرسال: بوستر + نص، وبديل نصي لو الصورة فشلت ----------------
async function deliverPoster(html: string, caption: string, fallbackText: string, deps: Deps) {
  const render = deps.renderPng ?? renderPosterPng;
  const sendPhoto = deps.sendPhoto ?? ((png: Uint8Array, cap: string) => sendTelegramPhoto(png, cap));
  const send = deps.send ?? ((t: string) => sendTelegramMessage(t));
  try {
    const png = await render(html);
    await sendPhoto(png, caption);
    return "photo" as const;
  } catch {
    // الصورة فشلت (مفيش توكن / حصة خلصت / عطل) — القناة ما تفضلش من غير تحديث
    await send(fallbackText);
    return "text" as const;
  }
}

function currencyFallbackText(gold: any, currency: any): string {
  const rates = currency?.rates ?? {};
  const row = (emoji: string, label: string, p: Pair) =>
    p.buy !== null || p.sell !== null
      ? `${emoji} ${label}:  شراء ${b(fmt2(p.buy ?? 0))} • بيع ${b(fmt2(p.sell ?? 0))}`
      : null;
  return joinGroups(
    [
      [row("💵", "الدولار", pair(rates["usd"]))],
      [isNum(gold?.implied_usd_rate) ? `💵 دولار الصاغة:  ${b(fmt2(gold.implied_usd_rate))} جنيه` : null],
      POSTER_CURRENCIES.map((c) => row("🔸", c.name, pair(rates[c.code]))),
      [`🌐 موقعنا الإلكتروني: ${TG_CONFIG.SITE_URL}`],
      [`📢 قناتنا على تليجرام: ${TG_CONFIG.CHANNEL_URL}`],
    ],
    "\n\n",
  );
}

const LINKS = () => ({ site: TG_CONFIG.SITE_URL, channel: TG_CONFIG.CHANNEL_URL });

// ---------------- الفحص اللحظي (الذهب) ----------------
export async function checkAndSendInstant(
  db: D1Like,
  day: string,
  gold: any,
  currency: any,
  deps: Deps,
) {
  const item = TG_CONFIG.MAIN_ITEM;
  const current = extractPrices(gold, currency)[item];
  if (current === undefined) return { status: "no-price" as const };

  const last = await db
    .prepare("SELECT price FROM last_sent WHERE item = ?1")
    .bind(item)
    .first<{ price: number }>();

  if (last && Math.abs(current - last.price) < TG_CONFIG.THRESHOLD_EGP) {
    return { status: "below-threshold" as const, diff: Number((current - last.price).toFixed(2)) };
  }

  // "حجز" ذري قبل الإرسال: لو فحصين اشتغلوا في نفس اللحظة، واحد بس بينجح في التحديث
  const now = Date.now();
  const claim = last
    ? await db
        .prepare("UPDATE last_sent SET price = ?1, sent_at = ?2 WHERE item = ?3 AND price = ?4")
        .bind(current, now, item, last.price)
        .run()
    : await db
        .prepare("INSERT OR IGNORE INTO last_sent (item, price, sent_at) VALUES (?1, ?2, ?3)")
        .bind(item, current, now)
        .run();
  if (claim.meta.changes !== 1) return { status: "claimed-elsewhere" as const };

  try {
    const cur: GoldSnap = extractPrices(gold, currency);
    // السعر المرجعي: لقطة آخر رسالة (لو موجودة)، وإلا على الأقل سعر عيار 21 اللي في last_sent
    const prev: GoldSnap = (await loadSnap<GoldSnap>(db, "gold_last")) ?? (last ? { gold21: last.price } : {});
    if (last && prev.gold21 === undefined) prev.gold21 = last.price;

    let range: DayRange = null;
    try {
      const r = await db
        .prepare("SELECT open, high, low FROM daily_stats WHERE day = ?1 AND item = ?2")
        .bind(day, item)
        .first<{ open: number; high: number; low: number }>();
      if (r) range = r;
    } catch {
      // نكمل من غير نطاق اليوم
    }

    const dt = cairoDateTime(deps.nowDate);
    const html = goldPosterHtml(goldPosterData(gold, currency, dt), deps.assets);
    const caption = goldCaption(cur, prev, range, LINKS());
    const fallback = `${goldNarrative(cur, prev, range)}\n\n${formatInstant(gold, currency)}`;
    const mode = await deliverPoster(html, caption, fallback, deps);

    await saveSnap(db, "gold_last", cur);
    return { status: "sent" as const, price: current, mode };
  } catch (e) {
    // فشل الإرسال نفسه (تيليجرام): نرجّع المرجع القديم عشان المحاولة الجاية تعيد الإرسال
    if (last) {
      await db
        .prepare("UPDATE last_sent SET price = ?1 WHERE item = ?2 AND price = ?3")
        .bind(last.price, item, current)
        .run();
    } else {
      await db.prepare("DELETE FROM last_sent WHERE item = ?1").bind(item).run();
    }
    return { status: "send-failed" as const, error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------- رسالة أول الصباح: العملات ----------------
export async function sendMorningCurrenciesIfDue(
  db: D1Like,
  day: string,
  gold: any,
  currency: any,
  deps: Deps,
) {
  if (!currency?.rates?.["usd"]) return { status: "no-currency-data" as const };

  const flagKey = `ccy-morning:${day}`;
  const done = await db.prepare("SELECT 1 AS x FROM daily_flags WHERE day = ?1").bind(flagKey).first();
  if (done) return { status: "already-sent" as const };

  const claim = await db
    .prepare("INSERT OR IGNORE INTO daily_flags (day, sent_at) VALUES (?1, ?2)")
    .bind(flagKey, Date.now())
    .run();
  if (claim.meta.changes !== 1) return { status: "claimed-elsewhere" as const };

  try {
    const cur = ccySnap(gold, currency);
    const prev = await loadLatestCcySnapBefore(db, day);
    const dt = cairoDateTime(deps.nowDate);
    const html = currencyPosterHtml(currencyPosterData(gold, currency, dt), deps.assets);
    const caption = currencyCaption(cur, prev, LINKS());
    const fallback = `${currencyNarrative(cur, prev)}\n\n${currencyFallbackText(gold, currency)}`;
    const mode = await deliverPoster(html, caption, fallback, deps);
    return { status: "sent" as const, mode };
  } catch (e) {
    await db.prepare("DELETE FROM daily_flags WHERE day = ?1").bind(flagKey).run();
    return { status: "send-failed" as const, error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------- ملخص الإغلاق ----------------
export async function sendDailySummaryIfDue(
  db: D1Like,
  day: string,
  gold: any,
  currency: any,
  send: (text: string) => Promise<unknown>,
  sendWhatsApp?: (text: string) => Promise<unknown>,
  force = false,
) {
  if (!force) {
    const done = await db
      .prepare("SELECT 1 AS x FROM daily_flags WHERE day = ?1")
      .bind(day)
      .first();
    if (done) return { status: "already-sent" as const };
  }

  // آخر سعر قبل الإقفال يتسجل كإغلاق
  await recordStats(db, day, extractPrices(gold, currency));
  const { results } = await db
    .prepare("SELECT item, open, high, low, close FROM daily_stats WHERE day = ?1")
    .bind(day)
    .all<StatRow>();
  if (!results.length) return { status: "no-data" as const };

  if (!force) {
    const claim = await db
      .prepare("INSERT OR IGNORE INTO daily_flags (day, sent_at) VALUES (?1, ?2)")
      .bind(day, Date.now())
      .run();
    if (claim.meta.changes !== 1) return { status: "claimed-elsewhere" as const };
  }

  const text = formatSummary(day, results);
  try {
    await send(text);
  } catch (e) {
    if (!force) await db.prepare("DELETE FROM daily_flags WHERE day = ?1").bind(day).run();
    return { status: "send-failed" as const, error: e instanceof Error ? e.message : String(e) };
  }

  // لقطة إقفال العملات: بتتقارن بيها رسالة الصباح التالي
  if (!force) await saveSnap(db, `ccy:${day}`, ccySnap(gold, currency));

  // واتساب اختياري: فشله ما يلغيش نجاح تيليجرام (نفس سلوك الملخص القديم)
  let whatsapp: { ok: boolean; error?: string } = { ok: true };
  if (sendWhatsApp) {
    try {
      await sendWhatsApp(text);
    } catch (e) {
      whatsapp = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
  return { status: "sent" as const, whatsapp };
}

// ---------------- نقطة الدخول (بتتنادى كل دقيقة من /api/push/check) ----------------
export async function runTelegramAutomation(gold: any, currency: any, deps: Deps = {}) {
  if (!gold) return { status: "no-gold-data" as const };

  const { day, hour } = deps.now ?? cairoNow();
  // ليلاً قبل الافتتاح: لا إرسال ولا حتى لمس قاعدة البيانات
  if (hour < TG_CONFIG.OPEN_HOUR) return { status: "night" as const };

  const db = deps.db === undefined ? await getDb() : deps.db;
  if (!db) return { status: "db-not-configured" as const };

  const send = deps.send ?? ((t: string) => sendTelegramMessage(t));
  const sendWa = deps.sendWhatsApp ?? ((t: string) => sendWhatsAppMessage(t));

  // بعد الإغلاق: لا رسائل لحظية، ملخص اليوم مرة واحدة فقط
  if (hour >= TG_CONFIG.CLOSE_HOUR) {
    return sendDailySummaryIfDue(db, day, gold, currency, send, sendWa, deps.force === true);
  }

  await recordStats(db, day, extractPrices(gold, currency));
  // أول رسالة في اليوم = العملات (مرة واحدة)، وبعدها الفحص اللحظي للذهب
  const morning = await sendMorningCurrenciesIfDue(db, day, gold, currency, deps);
  const instant = await checkAndSendInstant(db, day, gold, currency, deps);
  return { ...instant, morning: morning.status };
}

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

import { sendTelegramMessage } from "./telegram.server";
import { sendWhatsAppMessage } from "./whatsapp.server";

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
  send?: (text: string) => Promise<unknown>;
  sendWhatsApp?: (text: string) => Promise<unknown>;
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

// مجموعات الأسطر بينها سطر فارغ؛ المجموعة الفاضية بتتشال، والسطر الناقص بيتشال
function joinGroups(groups: Array<Array<string | null>>): string {
  return groups
    .map((g) => g.filter((l): l is string => l !== null).map(rtl))
    .filter((g) => g.length > 0)
    .map((g) => g.join("\n"))
    .join("\n\n");
}

export function formatInstant(gold: any, currency: any): string {
  const c = (k: string) => gold?.caratPrices?.[k];
  const line = (emoji: string, label: string, v: unknown, unit = "", f = fmt) =>
    isNum(v) ? `${emoji} ${label}: ${f(v)}${unit ? ` ${unit}` : ""}` : null;

  return joinGroups([
    ["✨ أسعار الذهب الآن ✨"],
    [
      line("💍", "عيار 24", c("24")?.sell, "جنيه"),
      line("💍", "عيار 21", c("21")?.sell, "جنيه"),
      line("💍", "عيار 18", c("18")?.sell, "جنيه"),
    ],
    [
      line("🪙", "جنيه الذهب", gold?.pound?.sell, "جنيه"),
      line("📊", "الأونصة بالدولار", gold?.ounce_usd, "دولار", (n) =>
        fmt(n, { maximumFractionDigits: 2 }),
      ),
    ],
    [
      line("🌟", "سعر الشراء", c("21")?.buy),
      line("🌟", "سعر البيع", c("21")?.sell),
    ],
    [
      line("💵", "سعر الدولار", currency?.rates?.usd?.sell, "جنيه", fmt2),
      line("💵", "دولار الصاغة", gold?.implied_usd_rate, "جنيه", fmt2),
    ],
    [`🌐 موقعنا الإلكتروني: ${TG_CONFIG.SITE_URL}`],
    [`📢 قناتنا على تليجرام: ${TG_CONFIG.CHANNEL_URL}`],
  ]);
}

type StatRow = { item: string; open: number; high: number; low: number; close: number };

const SUMMARY_LABELS: Array<{ key: ItemKey; label: string; decimals: number }> = [
  { key: "gold24", label: "💍 عيار 24", decimals: 0 },
  { key: "gold21", label: "💍 عيار 21", decimals: 0 },
  { key: "gold18", label: "💍 عيار 18", decimals: 0 },
  { key: "gold_pound", label: "🪙 جنيه الذهب", decimals: 0 },
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
        label,
        `🟢 الافتتاح: ${f(r.open)}   🔴 الإغلاق: ${f(r.close)}`,
        `⬆️ الأعلى: ${f(r.high)}   ⬇️ الأقل: ${f(r.low)}`,
      ],
    ];
  });

  return joinGroups([
    ["🌙 ملخص تداولات اليوم 🌙", `📅 ${date}`],
    ...blocks,
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

// ---------------- الفحص اللحظي ----------------
export async function checkAndSendInstant(
  db: D1Like,
  gold: any,
  currency: any,
  send: (text: string) => Promise<unknown>,
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
    await send(formatInstant(gold, currency));
    return { status: "sent" as const, price: current };
  } catch (e) {
    // فشل الإرسال: نرجّع المرجع القديم عشان المحاولة الجاية تعيد الإرسال
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
  return checkAndSendInstant(db, gold, currency, send);
}

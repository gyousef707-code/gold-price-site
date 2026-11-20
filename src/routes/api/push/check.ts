import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import {
  getGoldPrices,
  getCurrencyRates,
  getCryptoPrices,
  getSilverPrices,
} from "@/lib/market.server";
import {
  getSnapshot,
  saveSnapshot,
  getNotified,
  saveNotified,
  getPending,
  savePending,
  savePendingIfEmpty,
  clearPending,
  cairoParts,
  getDayState,
  saveDayState,
  rollDayState,
  buildMorningItems,
  buildCombinedChange,
  computeSnapshot,
  sendPushToAll,
  getAllSubscriptions,
  anySilverAlerts,
  computeAlertPrices,
  processPriceAlerts,
} from "@/lib/push.server";
import { upstash } from "@/lib/upstash.server";
import { runTelegramAutomation } from "@/lib/telegram-live.server";
import { processCountryAlerts } from "@/lib/country-alerts.server";
import { recordCountrySnapshotNow } from "@/lib/country-prices.server";

// ده الـ endpoint اللي بينده عليه cron خارجي كل دقيقة. كل مرة بيفحص معدن واحد بس
// بالتبادل (عيار 21 ← عيار 24 ← الدولار ← تكرار)، ولو فيه تغيّر حقيقي يبعت:
// 1) Push حقيقي لكل الأجهزة المشتركة (حتى لو التطبيق مقفول)
// وبعدها (بشكل مستقل) أتمتة تيليجرام: رسالة لحظية لو عيار 21 اتغير 5 جنيه عن آخر رسالة،
// وإيقاف ليلي، وملخص إغلاق يومي (شوف telegram-live.server.ts)
// ---- اهتمامات الأجهزة في الإشعارات العامة (أي عيار/الأونصة يوصل لكل جهاز) ----
// بتتخزن في Hash لوحدها (push:prefs:hash) عشان ما تتمسحش لما الجهاز يعيد الاشتراك.
async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function loadPrefsMap(): Promise<Record<string, Record<string, boolean>>> {
  try {
    const flat: string[] = (await upstash("HGETALL", "push:prefs:hash")) || [];
    const out: Record<string, Record<string, boolean>> = {};
    for (let i = 0; i < flat.length; i += 2) {
      try {
        out[flat[i]!] = JSON.parse(flat[i + 1]!);
      } catch {
        // تجاهل أي قيمة تالفة
      }
    }
    return out;
  } catch {
    return {};
  }
}

function wants(prefs: Record<string, boolean> | undefined, which: string) {
  if (!prefs) return true; // جهاز ما اختارش اهتمامات: بيستقبل كل حاجة زي الأول
  if (which === "usd") return false;
  return !!prefs[which];
}

// عدد الأجهزة في الدفعة الواحدة. كل جهاز = طلب فرعي، وحد Cloudflare المجانية 50 لكل تشغيل،
// فبنسيب هامش لباقي أوامر Upstash وللاشتراكات الميتة اللي بتتمسح.
const BATCH_SIZE = 20;

// بيبعت الدفعة الجاية من الإشعار المعلّق (بيتنده عليه من cron منفصل كل دقيقة بـ ?mode=drain)
async function drainPending() {
  const pending = await getPending();
  if (!pending) return { pending: false };

  const all = (await getAllSubscriptions()).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const rest = pending.lastId ? all.filter((e) => e.id > pending.lastId!) : all;
  const batch = rest.slice(0, BATCH_SIZE);
  if (batch.length === 0) {
    await clearPending();
    return { pending: false, done: true };
  }

  const prefsMap = await loadPrefsMap();
  // كل جهاز ياخد بس الأسطر اللي مهتم بيها
  const groups = new Map<string, { keys: string[]; entries: typeof batch }>();
  for (const entry of batch) {
    const prefs = prefsMap[await sha256Hex(entry.sub.endpoint)];
    const keys = pending.items.filter((i) => wants(prefs, i.key)).map((i) => i.key);
    if (keys.length === 0) continue;
    const gid = keys.join(",");
    const g = groups.get(gid) ?? { keys, entries: [] };
    g.entries.push(entry);
    groups.set(gid, g);
  }

  let sent = 0;
  let removed = 0;
  for (const g of groups.values()) {
    const chosen = pending.items.filter((i) => g.keys.includes(i.key));
    const [primary, ...others] = chosen;
    if (!primary) continue;
    // العنوان والنص من النوع الأساسي، وأي نوع تاني بيتضاف كسطر مختصر
    const body = [primary.body, ...others.map((i) => i.short).filter(Boolean)].join("\n");
    const r = await sendPushToAll(
      { title: primary.title, body, url: "/", tag: pending.tag ?? "price-update" },
      g.entries,
    );
    sent += r.sent;
    removed += r.removed;
  }

  const remaining = rest.length - batch.length;
  if (remaining <= 0) await clearPending();
  else await savePending({ ...pending, lastId: batch[batch.length - 1]!.id });
  return { pending: remaining > 0, batch: batch.length, sent, removed, remaining };
}

export const Route = createFileRoute("/api/push/check")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const requiredSecret = process.env['CRON_SECRET'];
          const provided = new URL(request.url).searchParams.get("secret");
          if (requiredSecret && provided !== requiredSecret) {
            return jsonErr(new Error("غير مصرح"), 401);
          }

          // وضع الإرسال: بيبعت دفعة من الإشعار المعلّق بس (من غير ما يجيب أسعار)
          if (new URL(request.url).searchParams.get("mode") === "drain") {
            return jsonOk({ drain: await drainPending() });
          }

          const [gold, currency, crypto] = await Promise.all([
            getGoldPrices().catch(() => null),
            getCurrencyRates().catch(() => null),
            getCryptoPrices().catch(() => null),
          ]);

          // أتمتة تيليجرام الأول وبشكل مستقل تماماً (D1 + تيليجرام بس):
          // لو Upstash أو أي حاجة تانية وقعت، رسايل القناة ما بتقفش.
          let telegram: unknown = null;
          try {
            telegram = await runTelegramAutomation(gold, currency);
          } catch (e) {
            telegram = { status: "error", error: e instanceof Error ? e.message : String(e) };
          }

          // باقي الفحص (إشعارات الأجهزة وتنبيهات الأسعار) بيعتمد على Upstash، فاتحط في كتلة لوحده
          let core: Record<string, unknown> = {};
          try {
            const now = computeSnapshot(gold, currency, crypto);
            const prev = await getSnapshot();

            // إشعار واحد مجمّع: بنقارن بآخر سعر اتبعت فعلاً (لو مفيش، بآخر فحص)، وبعتبة وفاصل أدنى
            const notified = await getNotified();
            const items = buildCombinedChange(notified, prev, now, Date.now());

            // الاشتراكات بتتجاب مرة واحدة بس (أمر Upstash واحد) وتتستخدم للإشعار العام
            // ولتنبيهات الأسعار المستهدفة الخاصة بكل جهاز.
            const subs = await getAllSubscriptions();

            // بنحفظ الأسعار هنا قبل أي إرسال: لو حصل خطأ بعد كده (حد الطلبات الفرعية في Cloudflare مثلاً)
            // متفضلش الأسعار المحفوظة قديمة ولا الإشعار يتكرر كل دقيقتين لنفس الناس.
            if (items) {
              const baseline: Record<string, number> = { at: Date.now() };
              for (const k of ["k21", "k24", "usd"] as const) if (now[k] != null) baseline[k] = now[k] as number;
              await saveNotified(baseline);
            }
            await saveSnapshot(now);

            // إشعار "صباح الخير" (مرة في اليوم بعد 9 الصبح بتوقيت القاهرة): مقارنة بآخر سعر أمس
            let morning: string | null = null;
            try {
              const { date, hour } = cairoParts();
              const state = rollDayState(await getDayState(), now, date);
              if (hour >= 9 && hour < 13 && state.morning !== date) {
                const mItems = buildMorningItems(state, now);
                if (mItems) {
                  const ok = await savePendingIfEmpty({
                    id: String(Date.now()),
                    items: mItems,
                    lastId: null,
                    createdAt: Date.now(),
                    tag: "morning-update",
                  });
                  morning = ok ? "queued" : "waiting";
                  if (ok) state.morning = date;
                }
              }
              await saveDayState(state);
            } catch (e) {
              morning = `error: ${e instanceof Error ? e.message : String(e)}`;
            }

            // الإرسال نفسه بيحصل على دفعات من تشغيل منفصل (?mode=drain)، هنا بس بنسجّل الإشعار المعلّق
            let result: Record<string, unknown> = {};
            if (items) {
              await savePending({ id: String(Date.now()), items, lastId: null, createdAt: Date.now() });
              result = { queued: true };
            }

            // تنبيهات السعر المستهدف: مستقلة، وفشلها ما بيوقفش باقي الفحص.
            let alerts = { fired: 0, failed: 0 };
            try {
              const silver = anySilverAlerts(subs) ? await getSilverPrices().catch(() => null) : null;
              alerts = await processPriceAlerts(subs, computeAlertPrices(gold, silver));
            } catch {
              // نكمل عادي
            }

            // تنبيهات الدول: مستقلة تماماً عن تنبيهات مصر.
            let countryAlerts = { fired: 0, failed: 0 };
            try {
              countryAlerts = await processCountryAlerts(subs);
            } catch {
              // نكمل عادي
            }

            core = { changed: !!items, items, morning, alerts, countryAlerts, ...result };
          } catch (e) {
            core = { upstashError: e instanceof Error ? e.message : String(e) };
          }

          // أرشيف أسعار الدول: بنسجلها بعد الفحص الأساسي عشان متاكلش من حد الطلبات الفرعية بتاعه
          let countryArchive: unknown = null;
          try {
            countryArchive = await recordCountrySnapshotNow();
          } catch (e) {
            countryArchive = { error: e instanceof Error ? e.message : String(e) };
          }

          return jsonOk({ telegram, countryArchive, ...core });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

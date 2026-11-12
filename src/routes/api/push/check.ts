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
  buildChangeMessage,
  computeSnapshot,
  sendPushToAll,
  getAllSubscriptions,
  anySilverAlerts,
  computeAlertPrices,
  processPriceAlerts,
  getRotationIndex,
  saveRotationIndex,
  ROTATION_ORDER,
} from "@/lib/push.server";
import { upstash } from "@/lib/upstash.server";
import { runTelegramAutomation } from "@/lib/telegram-live.server";
import { processCountryAlerts } from "@/lib/country-alerts.server";

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

            const idx = await getRotationIndex();
            const which = ROTATION_ORDER[idx % ROTATION_ORDER.length]!;
            const message = buildChangeMessage(prev, now, which);

            // الاشتراكات بتتجاب مرة واحدة بس (أمر Upstash واحد) وتتستخدم للإشعار العام
            // ولتنبيهات الأسعار المستهدفة الخاصة بكل جهاز.
            const subs = await getAllSubscriptions();

            let result = { sent: 0, removed: 0, total: 0 };
            if (message) {
              const prefsMap = await loadPrefsMap();
              const interested: typeof subs = [];
              for (const entry of subs) {
                if (wants(prefsMap[await sha256Hex(entry.sub.endpoint)], which)) interested.push(entry);
              }
              result = await sendPushToAll({ ...message, url: "/", tag: "price-update" }, interested);
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

            await saveSnapshot(now);
            await saveRotationIndex(idx + 1);
            core = { changed: !!message, which, message, alerts, countryAlerts, ...result };
          } catch (e) {
            core = { upstashError: e instanceof Error ? e.message : String(e) };
          }

          return jsonOk({ telegram, ...core });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

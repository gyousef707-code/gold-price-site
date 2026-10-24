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
import { runTelegramAutomation } from "@/lib/telegram-live.server";

// ده الـ endpoint اللي بينده عليه cron خارجي كل دقيقة. كل مرة بيفحص معدن واحد بس
// بالتبادل (عيار 21 ← عيار 24 ← الدولار ← تكرار)، ولو فيه تغيّر حقيقي يبعت:
// 1) Push حقيقي لكل الأجهزة المشتركة (حتى لو التطبيق مقفول)
// وبعدها (بشكل مستقل) أتمتة تيليجرام: رسالة لحظية لو عيار 21 اتغير 5 جنيه عن آخر رسالة،
// وإيقاف ليلي، وملخص إغلاق يومي (شوف telegram-live.server.ts)
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
            result = await sendPushToAll({ ...message, url: "/", tag: "price-update" }, subs);
          }

          // أتمتة تيليجرام: فشلها ما بيوقفش الإشعارات ولا تنبيهات السعر
          let telegram: unknown = null;
          try {
            telegram = await runTelegramAutomation(gold, currency);
          } catch (e) {
            telegram = { status: "error", error: e instanceof Error ? e.message : String(e) };
          }

          // تنبيهات السعر المستهدف: فحص مستقل عن الدورة أعلاه، بيشتغل في كل استدعاء.
          // فشله ما بيوقفش باقي الفحص.
          let alerts = { fired: 0, failed: 0 };
          try {
            const silver = anySilverAlerts(subs) ? await getSilverPrices().catch(() => null) : null;
            alerts = await processPriceAlerts(subs, computeAlertPrices(gold, silver));
          } catch {
            // نكمل عادي
          }

          await saveSnapshot(now);
          await saveRotationIndex(idx + 1);

          return jsonOk({ changed: !!message, which, message, telegram, alerts, ...result });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

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
import { sendTelegramMessage } from "@/lib/telegram.server";

// ده الـ endpoint اللي بينده عليه cron خارجي كل دقيقة. كل مرة بيفحص معدن واحد بس
// بالتبادل (عيار 21 ← عيار 24 ← الدولار ← تكرار)، ولو فيه تغيّر حقيقي يبعت:
// 1) Push حقيقي لكل الأجهزة المشتركة (حتى لو التطبيق مقفول)
// 2) رسالة على قناة تيليجرام (لو المتغيرات مظبوطة)
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
          let telegramSent = false;
          if (message) {
            result = await sendPushToAll({ ...message, url: "/", tag: "price-update" }, subs);
            try {
              await sendTelegramMessage(`💰 <b>${message.title}</b>\n${message.body}\n\n🔗 zahaby1.com`);
              telegramSent = true;
            } catch {
              // فشل تيليجرام ما يوقفش باقي العملية (ممكن المتغيرات لسه مش مظبوطة)
            }
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

          return jsonOk({ changed: !!message, which, message, telegramSent, alerts, ...result });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

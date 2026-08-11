import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { getGoldPrices, getCurrencyRates, getCryptoPrices } from "@/lib/market.server";
import {
  getSnapshot,
  saveSnapshot,
  buildChangeMessage,
  computeSnapshot,
  sendPushToAll,
} from "@/lib/push.server";

// ده الـ endpoint اللي هيتنادى من خدمة cron خارجية (زي cron-job.org) كل دقيقة أو اتنين.
// بيقارن الأسعار الحالية بآخر نسخة محفوظة في Redis، ولو فيه تغيّر يبعت Push حقيقي
// لكل الأجهزة المشتركة — حتى لو التطبيق مقفول تمامًا على موبايلاتهم.
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
          const message = buildChangeMessage(prev, now);

          let result = { sent: 0, removed: 0, total: 0 };
          if (message) {
            result = await sendPushToAll({ ...message, url: "/", tag: "price-update" });
          }

          await saveSnapshot(now);

          return jsonOk({ changed: !!message, message, ...result });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { getGoldPrices, getCurrencyRates } from "@/lib/market.server";
import { runTelegramAutomation, cairoNow, TG_CONFIG } from "@/lib/telegram-live.server";

// كان cron خارجي بينده على الـ endpoint ده كل ساعة. دلوقتي بقى للملخص اليومي بس:
//  - الفحص اللحظي والملخص بيتبعتوا تلقائيًا من /api/push/check (كل دقيقة)،
//    فالـ endpoint ده اختياري: لو حبيت cron يومي إضافي (23:00) هيشتغل بأمان.
//  - آمن لو cron الساعة القديم لسه شغال: قبل الإغلاق بيرجّع "not-yet"،
//    وبعده الملخص بيتبعت مرة واحدة في اليوم بس (already-sent بعد كده).
//  - ?force=1 لاختبار يدوي: بيبعت ملخص اليوم فورًا بدون شرط الوقت وبدون علامة "اتبعت".
export const Route = createFileRoute("/api/telegram/summary")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const requiredSecret = process.env["CRON_SECRET"];
          const url = new URL(request.url);
          if (requiredSecret && url.searchParams.get("secret") !== requiredSecret) {
            return jsonErr(new Error("غير مصرح"), 401);
          }

          const [gold, currency] = await Promise.all([
            getGoldPrices().catch(() => null),
            getCurrencyRates().catch(() => null),
          ]);
          if (!gold) return jsonErr(new Error("تعذر جلب أسعار الذهب"), 502);

          const force = url.searchParams.get("force") === "1";
          const now = cairoNow();
          if (!force && now.hour < TG_CONFIG.CLOSE_HOUR) {
            return jsonOk({ status: "not-yet", closeHour: TG_CONFIG.CLOSE_HOUR });
          }

          // now.hour = CLOSE_HOUR يخلّي runTelegramAutomation يدخل مسار الملخص مباشرة
          const result = await runTelegramAutomation(gold, currency, {
            now: { day: now.day, hour: Math.max(now.hour, TG_CONFIG.CLOSE_HOUR) },
            force,
          });
          return jsonOk(result);
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

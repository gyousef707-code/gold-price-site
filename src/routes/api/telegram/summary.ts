import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { getGoldPrices, getCurrencyRates } from "@/lib/market.server";
import { sendTelegramMessage } from "@/lib/telegram.server";

// ده الـ endpoint اللي بينده عليه cron خارجي كل ساعة، وبيبعت ملخص أسعار كامل
// لقناة تيليجرام (كل الأعيرة + الجنيه الذهب + الأونصة + الدولار)
export const Route = createFileRoute("/api/telegram/summary")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const requiredSecret = process.env['CRON_SECRET'];
          const provided = new URL(request.url).searchParams.get("secret");
          if (requiredSecret && provided !== requiredSecret) {
            return jsonErr(new Error("غير مصرح"), 401);
          }

          const [gold, currency] = await Promise.all([
            getGoldPrices().catch(() => null),
            getCurrencyRates().catch(() => null),
          ]);

          if (!gold) {
            return jsonErr(new Error("تعذر جلب أسعار الذهب"), 502);
          }

          const carat = (k: string) => (gold as any)?.caratPrices?.[k]?.sell;
          const time = new Date().toLocaleTimeString("ar-EG", {
            timeZone: "Africa/Cairo",
            hour: "2-digit",
            minute: "2-digit",
          });

          const lines = [
            `📊 <b>ملخص أسعار الذهب</b> — ${time}`,
            "",
            carat("24") ? `🥇 عيار 24: ${Number(carat("24")).toLocaleString("en-US")} ج.م` : null,
            carat("22") ? `🥇 عيار 22: ${Number(carat("22")).toLocaleString("en-US")} ج.م` : null,
            carat("21") ? `🥇 عيار 21: ${Number(carat("21")).toLocaleString("en-US")} ج.م` : null,
            carat("18") ? `🥇 عيار 18: ${Number(carat("18")).toLocaleString("en-US")} ج.م` : null,
            (gold as any)?.pound?.sell
              ? `💰 الجنيه الذهب: ${Number((gold as any).pound.sell).toLocaleString("en-US")} ج.م`
              : null,
            (gold as any)?.ounce_usd
              ? `🌍 الأونصة العالمية: $${Number((gold as any).ounce_usd).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
              : null,
            (currency as any)?.rates?.usd?.sell
              ? `💵 الدولار: ${Number((currency as any).rates.usd.sell).toLocaleString("en-US")} ج.م للبيع`
              : null,
            "",
            "🔗 zahaby1.com",
          ].filter(Boolean);

          await sendTelegramMessage(lines.join("\n"));

          return jsonOk({ ok: true });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

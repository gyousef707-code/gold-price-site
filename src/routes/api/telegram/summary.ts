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

          // علامة فرض اتجاه لليمين (RLM) — بتتحط في أول كل سطر عشان نضمن إن
          // الرمز/الإيموجي يفضل ظاهر على أقصى اليمين على كل الأجهزة، حتى
          // لو السطر بدأ برقم أو رمز مش عربي
          const RLM = "\u200F";
          const rtl = (s: string) => `${RLM}${s}`;

          const carat = (k: string) => (gold as any)?.caratPrices?.[k]?.sell;
          const carat21 = (gold as any)?.caratPrices?.["21"];
          const time = new Date().toLocaleTimeString("ar-EG", {
            timeZone: "Africa/Cairo",
            hour: "2-digit",
            minute: "2-digit",
          });
          const fmt = (n: number, opts?: Intl.NumberFormatOptions) =>
            Number(n).toLocaleString("en-US", opts);

          const DIVIDER = "➖➖➖➖➖➖➖➖➖➖";

          const lines = [
            rtl(`✨ <b>ذهبي | أسعار الذهب اليوم</b> ✨`),
            rtl(DIVIDER),
            "",
            rtl(`<b>🥇 أسعار الأعيرة</b>`),
            "",
            carat("24") ? rtl(`عيار 24     <b>${fmt(carat("24"))}</b> جنيه`) : null,
            carat("21") ? rtl(`عيار 21     <b>${fmt(carat("21"))}</b> جنيه`) : null,
            carat("18") ? rtl(`عيار 18     <b>${fmt(carat("18"))}</b> جنيه`) : null,
            "",
            rtl(`<b>📊 الأسواق العالمية</b>`),
            "",
            (gold as any)?.pound?.sell
              ? rtl(`💎 جنيه الذهب     <b>${fmt((gold as any).pound.sell)}</b> جنيه`)
              : null,
            (gold as any)?.ounce_usd
              ? rtl(`🌍 الأونصة عالميًا     <b>$${fmt((gold as any).ounce_usd, { maximumFractionDigits: 2 })}</b>`)
              : null,
            "",
            rtl(`<b>⭐ سعر التداول (عيار 21)</b>`),
            "",
            carat21?.buy ? rtl(`الشراء     <b>${fmt(carat21.buy)}</b> جنيه`) : null,
            carat21?.sell ? rtl(`البيع     <b>${fmt(carat21.sell)}</b> جنيه`) : null,
            "",
            rtl(`<b>💵 الدولار</b>`),
            "",
            (currency as any)?.rates?.usd?.sell
              ? rtl(`دولار البنك     <b>${fmt((currency as any).rates.usd.sell)}</b> جنيه`)
              : null,
            (gold as any)?.implied_usd_rate
              ? rtl(`دولار الصاغة     <b>${fmt((gold as any).implied_usd_rate)}</b> جنيه`)
              : null,
            "",
            rtl(DIVIDER),
            rtl(`🕐 آخر تحديث: ${time}`),
            "",
            rtl(`🌐 موقعنا: zahaby1.com`),
            rtl(`📢 قناتنا: t.me/zahaby1`),
          ].filter((l) => l !== null);

          await sendTelegramMessage(lines.join("\n"));

          return jsonOk({ ok: true });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

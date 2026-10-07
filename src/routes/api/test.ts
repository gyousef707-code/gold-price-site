import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { renderPosterPng } from "@/lib/poster.server";

// فحص تشخيصي لتوليد البوستر: بيجرّب يصوّر صفحة صغيرة ويرجّع النتيجة أو سبب الفشل.
// محمي بنفس CRON_SECRET. مفيش أي رسالة بتتبعت للقناة من هنا، والتوكن عمره ما بيظهر في الرد.
export const Route = createFileRoute("/api/telegram/test")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const requiredSecret = process.env["CRON_SECRET"];
          const url = new URL(request.url);
          if (requiredSecret && url.searchParams.get("secret") !== requiredSecret) {
            return jsonErr(new Error("غير مصرح"), 401);
          }
          const info = {
            hasAccountId: Boolean(process.env["CF_ACCOUNT_ID"]),
            accountIdLength: (process.env["CF_ACCOUNT_ID"] ?? "").length,
            hasToken: Boolean(process.env["CF_BROWSER_TOKEN"]),
          };
          try {
            const png = await renderPosterPng(
              `<html><body style="margin:0;background:#fff;font:60px sans-serif">test ✓</body></html>`,
            );
            return jsonOk({ ok: true, bytes: png.length, ...info });
          } catch (e) {
            return jsonOk({ ok: false, error: e instanceof Error ? e.message : String(e), ...info });
          }
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

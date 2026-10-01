import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { getSubscriptionAlerts, setSubscriptionAlerts } from "@/lib/push.server";

// POST { endpoint }                 ← بيرجّع تنبيهات الجهاز المخزّنة على السيرفر
// POST { endpoint, alerts: {...} }  ← بيستبدلها بالتنبيهات المفعّلة اللي في الصفحة
// الجهاز لازم يكون مشترك في الـ Push الأول (/api/push/subscribe)
export const Route = createFileRoute("/api/push/alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: any = await request.json();
          if (typeof body?.endpoint !== "string" || !body.endpoint) {
            return jsonErr(new Error("الـ endpoint ناقص"), 400);
          }

          let alerts;
          if (body.alerts && typeof body.alerts === "object") {
            alerts = await setSubscriptionAlerts(body.endpoint, body.alerts);
          } else {
            alerts = await getSubscriptionAlerts(body.endpoint);
          }
          if (alerts === null) {
            return jsonErr(new Error("الجهاز ده مش مشترك في الإشعارات"), 404);
          }
          return jsonOk({ ok: true, alerts });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

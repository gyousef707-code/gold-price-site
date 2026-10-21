import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { getSubscriptionCountryAlerts, setSubscriptionCountryAlerts } from "@/lib/country-alerts.server";

// POST { endpoint, country }                  ← بيرجّع تنبيهات الجهاز للدولة دي
// POST { endpoint, country, alerts: {...} }   ← بيستبدل تنبيهات الدولة دي بالمفعّلة في الصفحة
// الجهاز لازم يكون مشترك في الـ Push الأول (/api/push/subscribe)
export const Route = createFileRoute("/api/push/country-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: any = await request.json();
          if (typeof body?.endpoint !== "string" || !body.endpoint) {
            return jsonErr(new Error("الـ endpoint ناقص"), 400);
          }
          const country = String(body?.country || "").toLowerCase();
          let alerts;
          if (body.alerts && typeof body.alerts === "object") {
            alerts = await setSubscriptionCountryAlerts(body.endpoint, country, body.alerts);
          } else {
            alerts = await getSubscriptionCountryAlerts(body.endpoint, country);
          }
          if (alerts === null) {
            return jsonErr(new Error("الجهاز ده مش مشترك في الإشعارات أو الدولة غير مدعومة"), 404);
          }
          return jsonOk({ ok: true, alerts });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { saveSubscription } from "@/lib/push.server";

export const Route = createFileRoute("/api/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: any = await request.json();
          if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
            return jsonErr(new Error("بيانات الاشتراك ناقصة"), 400);
          }
          await saveSubscription({
            endpoint: body.endpoint,
            keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
          });
          return jsonOk({ ok: true });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

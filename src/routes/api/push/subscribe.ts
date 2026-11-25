import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { saveSubscription } from "@/lib/push.server";
import { validatePushSubscription } from "@/lib/push-validate";

export const Route = createFileRoute("/api/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // حد أقصى لحجم الطلب: بيانات الاشتراك الحقيقية أقل من 2 كيلوبايت بكتير
          const declaredSize = Number(request.headers.get("content-length") ?? 0);
          if (declaredSize > 8192) return jsonErr(new Error("الطلب كبير جدًا"), 413);
          const body: any = await request.json();
          const problem = validatePushSubscription(body);
          if (problem) return jsonErr(new Error(problem), 400);
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

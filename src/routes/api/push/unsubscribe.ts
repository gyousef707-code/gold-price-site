import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { removeSubscriptionByEndpoint } from "@/lib/push.server";

export const Route = createFileRoute("/api/push/unsubscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: any = await request.json();
          if (!body?.endpoint) {
            return jsonErr(new Error("الـ endpoint ناقص"), 400);
          }
          await removeSubscriptionByEndpoint(body.endpoint);
          return jsonOk({ ok: true });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

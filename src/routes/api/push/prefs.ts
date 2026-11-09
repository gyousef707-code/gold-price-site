import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { getSubscriptionPrefs, setSubscriptionPrefs } from "@/lib/push.server";

// POST { endpoint }                                    ← بيرجّع اهتمامات الجهاز
// POST { endpoint, prefs: { k18, k21, k24, ounce } }   ← بيحفظها
// (prefs ناقصة = جهاز قديم بيستقبل السلوك القديم: عيار 21 و24 والدولار)
export const Route = createFileRoute("/api/push/prefs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: any = await request.json();
          if (typeof body?.endpoint !== "string" || !body.endpoint) {
            return jsonErr(new Error("الـ endpoint ناقص"), 400);
          }
          if (body.prefs && typeof body.prefs === "object") {
            const prefs = await setSubscriptionPrefs(body.endpoint, body.prefs);
            if (prefs === null) return jsonErr(new Error("الجهاز ده مش مشترك في الإشعارات"), 404);
            return jsonOk({ ok: true, prefs });
          }
          const found = await getSubscriptionPrefs(body.endpoint);
          if (found === null) return jsonErr(new Error("الجهاز ده مش مشترك في الإشعارات"), 404);
          return jsonOk({ ok: true, prefs: found.prefs ?? null });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { upstash } from "@/lib/upstash.server";

// POST { endpoint }                                    ← بيرجّع اهتمامات الجهاز
// POST { endpoint, prefs: { k18, k21, k24, ounce } }   ← بيحفظها
// (prefs ناقصة = جهاز قديم بيستقبل السلوك القديم: عيار 21 و24 والدولار)
//
// الملف ده مستقل بذاته (من غير ما يستورد دوال من push.server.ts) عشان ما يتأثرش بأي
// تعديل في الملف ده. بيقرا ويكتب في نفس الـ Hash بتاع الاشتراكات.
const SUBS_HASH_KEY = "push:subs:hash";

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePrefs(input: any) {
  const out: Record<string, boolean> = {};
  for (const k of ["k18", "k21", "k24", "ounce"]) out[k] = !!input?.[k];
  return out;
}

export const Route = createFileRoute("/api/push/prefs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: any = await request.json();
          if (typeof body?.endpoint !== "string" || !body.endpoint) {
            return jsonErr(new Error("الـ endpoint ناقص"), 400);
          }
          const id = await sha256Hex(body.endpoint);
          const raw = await upstash("HGET", SUBS_HASH_KEY, id);
          if (!raw) return jsonErr(new Error("الجهاز ده مش مشترك في الإشعارات"), 404);
          const sub = JSON.parse(raw);

          if (body.prefs && typeof body.prefs === "object") {
            sub.prefs = normalizePrefs(body.prefs);
            await upstash("HSET", SUBS_HASH_KEY, id, JSON.stringify(sub));
            return jsonOk({ ok: true, prefs: sub.prefs });
          }
          return jsonOk({ ok: true, prefs: sub.prefs ?? null });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { upstash } from "@/lib/upstash.server";

// POST { endpoint }                                    ← بيرجّع اهتمامات الجهاز (أو null لو ما حدّدش)
// POST { endpoint, prefs: { k18, k21, k24, ounce } }   ← بيحفظها
// الاهتمامات متخزنة في Hash مستقل (push:prefs:hash) بمفتاح sha256(endpoint)،
// فمفيش اعتماد على ملف push.server.ts. جهاز من غير اهتمامات بيستقبل السلوك القديم (21 و24 والدولار).
const PREFS_HASH_KEY = "push:prefs:hash";

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
          if (typeof body?.endpoint !== "string" || !body.endpoint.startsWith("https://")) {
            return jsonErr(new Error("الـ endpoint ناقص أو غلط"), 400);
          }
          const id = await sha256Hex(body.endpoint);
          if (body.prefs && typeof body.prefs === "object") {
            const prefs = normalizePrefs(body.prefs);
            await upstash("HSET", PREFS_HASH_KEY, id, JSON.stringify(prefs));
            return jsonOk({ ok: true, prefs });
          }
          const raw = await upstash("HGET", PREFS_HASH_KEY, id);
          return jsonOk({ ok: true, prefs: raw ? JSON.parse(raw) : null });
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

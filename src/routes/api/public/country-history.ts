import { createFileRoute } from "@tanstack/react-router";
import { getCountryHistory } from "@/lib/country-prices.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

// /api/public/country-history?c=sa&days=365  — نفس شكل /api/public/gold-history: { history: [...] }
export const Route = createFileRoute("/api/public/country-history")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const u = new URL(request.url);
          const code = (u.searchParams.get("c") || "").toLowerCase();
          const raw = Number(u.searchParams.get("days"));
          const days = Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), 365) : 30;
          const data = await getCountryHistory(code, days);
          if (!data) return jsonErr(new Error("دولة غير مدعومة"), 404);
          return jsonOk({ history: data.history }, "s-maxage=3600, stale-while-revalidate=7200");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { getCountryData } from "@/lib/country-prices.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

// /api/public/country-prices?c=sa&t=gold|currencies|crypto
export const Route = createFileRoute("/api/public/country-prices")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const u = new URL(request.url);
          const code = (u.searchParams.get("c") || "").toLowerCase();
          const type = (u.searchParams.get("t") || "gold").toLowerCase();
          const data = await getCountryData(code, type);
          if (!data) return jsonErr(new Error("دولة غير مدعومة"), 404);
          return jsonOk(data, "s-maxage=45, stale-while-revalidate=60");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

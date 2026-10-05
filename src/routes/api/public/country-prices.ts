import { createFileRoute } from "@tanstack/react-router";
import { getCountryPrices } from "@/lib/country-prices.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const Route = createFileRoute("/api/public/country-prices")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const code = (new URL(request.url).searchParams.get("c") || "").toLowerCase();
          const data = await getCountryPrices(code);
          if (!data) return jsonErr(new Error("دولة غير مدعومة"), 404);
          return jsonOk(data, "s-maxage=45, stale-while-revalidate=60");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

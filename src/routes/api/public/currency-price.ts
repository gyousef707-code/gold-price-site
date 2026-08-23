import { createFileRoute } from "@tanstack/react-router";
import { getCurrencyRates } from "@/lib/market.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const Route = createFileRoute("/api/public/currency-price")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return jsonOk(await getCurrencyRates(), "s-maxage=120, stale-while-revalidate=180");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

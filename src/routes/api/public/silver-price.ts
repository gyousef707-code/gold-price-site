import { createFileRoute } from "@tanstack/react-router";
import { getSilverPrices } from "@/lib/market.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const Route = createFileRoute("/api/public/silver-price")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return jsonOk(await getSilverPrices(), "s-maxage=600, stale-while-revalidate=1200");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

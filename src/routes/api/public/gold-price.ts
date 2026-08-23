import { createFileRoute } from "@tanstack/react-router";
import { getGoldPrices } from "@/lib/market.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const Route = createFileRoute("/api/public/gold-price")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return jsonOk(await getGoldPrices(), "s-maxage=45, stale-while-revalidate=60");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

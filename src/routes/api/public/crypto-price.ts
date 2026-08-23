import { createFileRoute } from "@tanstack/react-router";
import { getCryptoPrices } from "@/lib/market.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const Route = createFileRoute("/api/public/crypto-price")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return jsonOk(await getCryptoPrices(), "s-maxage=60, stale-while-revalidate=120");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { getNews } from "@/lib/market.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const Route = createFileRoute("/api/public/news")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return jsonOk(await getNews(), "s-maxage=900, stale-while-revalidate=1800");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

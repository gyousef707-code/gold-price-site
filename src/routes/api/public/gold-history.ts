import { createFileRoute } from "@tanstack/react-router";
import { getRecentHistory } from "@/lib/gold-history.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const Route = createFileRoute("/api/public/gold-history")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const history = await getRecentHistory(30);
          return jsonOk({ history }, "s-maxage=3600, stale-while-revalidate=7200");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

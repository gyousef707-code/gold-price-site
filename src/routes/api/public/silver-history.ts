import { createFileRoute } from "@tanstack/react-router";
import { getRecentSilverHistory } from "@/lib/silver-history.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const Route = createFileRoute("/api/public/silver-history")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const history = await getRecentSilverHistory(30);
          return jsonOk({ history }, "s-maxage=3600, stale-while-revalidate=7200");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

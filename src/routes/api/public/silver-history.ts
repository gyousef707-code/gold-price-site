import { createFileRoute } from "@tanstack/react-router";
import { getRecentSilverHistory } from "@/lib/silver-history.server";
import { jsonOk, jsonErr } from "@/lib/api-response";

export const Route = createFileRoute("/api/public/silver-history")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const raw = Number(new URL(request.url).searchParams.get("days"));
          // الافتراضي 30 يوم، والحد الأقصى سنة
          const days = Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), 365) : 30;
          const history = await getRecentSilverHistory(days);
          return jsonOk({ history }, "s-maxage=3600, stale-while-revalidate=7200");
        } catch (e) {
          return jsonErr(e);
        }
      },
    },
  },
});

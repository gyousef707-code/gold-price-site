import { createFileRoute } from "@tanstack/react-router";
import CurrencyPage from "@/legacy/pages/CurrencyPage.jsx";
import { CURRENCY_META } from "@/legacy/data/currencies.js";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/currency/$code")({
  head: ({ params }) => {
    const codeLower = String(params.code || "").toLowerCase();
    const code = codeLower.toUpperCase();
    const meta = (CURRENCY_META as any)[codeLower];
    return seoMeta({
      title: meta?.title ?? `سعر ${code} مقابل الجنيه المصري اليوم | ذهبي`,
      description:
        meta?.description ??
        `تابع سعر ${code} مقابل الجنيه المصري اليوم لحظة بلحظة، سعر الشراء والبيع ومحول عملات فوري.`,
      keywords: `سعر ${code} اليوم, ${code} مقابل الجنيه`,
      path: `/currency/${params.code}`,
    });
  },
  component: CurrencyPage,
});

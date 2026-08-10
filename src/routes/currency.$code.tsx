import { createFileRoute } from "@tanstack/react-router";
import CurrencyPage from "@/legacy/pages/CurrencyPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/currency/$code")({
  head: ({ params }) => {
    const code = String(params.code || "").toUpperCase();
    return seoMeta({
      title: `سعر ${code} مقابل الجنيه المصري اليوم | ذهبي`,
      description: `تابع سعر ${code} مقابل الجنيه المصري اليوم لحظة بلحظة، سعر الشراء والبيع ومحول عملات فوري.`,
      keywords: `سعر ${code} اليوم, ${code} مقابل الجنيه`,
      path: `/currency/${params.code}`,
    });
  },
  component: CurrencyPage,
});

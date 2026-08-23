import { createFileRoute } from "@tanstack/react-router";
import CurrenciesPage from "@/legacy/pages/CurrenciesPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/currencies")({
  head: () =>
    seoMeta({
      title: "اسعار العملات اليوم في مصر | ذهبي",
      description:
        "تابع اسعار العملات اليوم بالجنيه المصري لحظة بلحظة، ومحول عملات مجاني بين أكتر من 14 عملة.",
      keywords: "اسعار العملات, سعر الدولار اليوم, سعر اليورو",
      path: "/currencies",
    }),
  component: CurrenciesPage,
});

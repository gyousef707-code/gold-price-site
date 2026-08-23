import { createFileRoute } from "@tanstack/react-router";
import SilverPage from "@/legacy/pages/SilverPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/silver")({
  head: () =>
    seoMeta({
      title: "سعر الفضة اليوم في مصر | ذهبي",
      description:
        "تابع سعر الفضة اليوم في مصر لحظة بلحظة بكل العيارات: 999، 925، 900، 800، 720، 500، بيع وشراء.",
      keywords: "سعر الفضة اليوم, اسعار الفضة في مصر",
      path: "/silver",
    }),
  component: SilverPage,
});

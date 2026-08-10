import { createFileRoute } from "@tanstack/react-router";
import GoldPage from "@/legacy/pages/GoldPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    seoMeta({
      title: "سعر الذهب اليوم في مصر | ذهبي",
      description:
        "تابع سعر الذهب اليوم في مصر لحظة بلحظة: عيار 24 و21 و18 وكل العيارات، بيع وشراء، محدثة أوتوماتيك.",
      keywords: "سعر الذهب اليوم, اسعار الذهب في مصر, سعر الذهب عيار 21",
      path: "/",
    }),
  component: GoldPage,
});

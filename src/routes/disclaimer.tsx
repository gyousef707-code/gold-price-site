import { createFileRoute } from "@tanstack/react-router";
import DisclaimerPage from "@/legacy/pages/DisclaimerPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/disclaimer")({
  head: () =>
    seoMeta({
      title: "إخلاء المسؤولية | ذهبي",
      description:
        "الأسعار المعروضة في ذهبي إرشادية لأغراض المعلومات فقط وليست نصيحة استثمارية أو عرض بيع أو شراء.",
      path: "/disclaimer",
    }),
  component: DisclaimerPage,
});

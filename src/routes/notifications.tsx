import { createFileRoute } from "@tanstack/react-router";
import NotificationsPage from "@/legacy/pages/NotificationsPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/notifications")({
  head: () =>
    seoMeta({
      title: "الإشعارات وتنبيهات الأسعار | ذهبي",
      description:
        "كل تنبيهات تحرك أسعار الذهب والفضة والدولار والعملات الرقمية مع وقت وتاريخ كل إشعار.",
      keywords: "تنبيهات اسعار الذهب, اشعارات سعر الدولار",
      path: "/notifications",
    }),
  component: NotificationsPage,
});

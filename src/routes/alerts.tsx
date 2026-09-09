import { createFileRoute } from "@tanstack/react-router";
import AlertSettingsPage from "@/legacy/pages/AlertSettingsPage";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/alerts")({
  head: () =>
    seoMeta({
      title: "إعدادات تنبيهات الأسعار | ذهبي",
      description:
        "اضبط تنبيهاتك الخاصة: اختار عيارات الذهب والفضة وسعر دولار الصاغة اللي عايز تتبلغ بتغيّرها فورًا.",
      keywords:
        "تنبيهات اسعار الذهب, اشعارات سعر الدولار, إعدادات التنبيهات, تنبيه تغير سعر الذهب",
      path: "/alerts",
    }),
  component: AlertSettingsPage,
});

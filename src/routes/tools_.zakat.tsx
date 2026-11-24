import { createFileRoute } from "@tanstack/react-router";
import ZakatPage from "@/legacy/pages/ZakatPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/tools_/zakat")({
  head: () =>
    seoMeta({
      title: "حاسبة زكاة الذهب | احسب زكاة ذهبك بالجرام والعيار | ذهبي",
      description:
        "حاسبة زكاة الذهب مجانية: اكتب وزن الذهب واختار العيار واعرف النصاب وكام الزكاة المستحقة (2.5%) على سعر الذهب اللحظي في مصر.",
      keywords: "حاسبة زكاة الذهب, زكاة الذهب, نصاب زكاة الذهب, حساب زكاة الذهب",
      path: "/tools/zakat",
    }),
  component: ZakatPage,
});

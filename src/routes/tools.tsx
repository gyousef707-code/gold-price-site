import { createFileRoute } from "@tanstack/react-router";
import ToolsPage from "@/legacy/pages/ToolsPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/tools")({
  head: () =>
    seoMeta({
      title: "الأدوات والحاسبات | ذهبي",
      description:
        "كل حاسبات ذهبي في مكان واحد: حاسبة الذهب، الفضة، الزكاة، محول العملات، حاسبة العملات الرقمية، وخطط الادخار.",
      keywords: "حاسبة الذهب, حاسبة زكاة الذهب, محول عملات",
      path: "/tools",
    }),
  component: ToolsPage,
});

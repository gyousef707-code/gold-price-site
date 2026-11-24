import { createFileRoute } from "@tanstack/react-router";
import ToolsPage from "@/legacy/pages/ToolsPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/tools")({
  head: () =>
    seoMeta({
      title: "حاسبة زكاة الذهب وحاسبة الذهب والفضة ومحول العملات | ذهبي",
      description:
        "حاسبة زكاة الذهب، وحاسبة الذهب بالمصنعية، وحاسبة الفضة، ومحول العملات، وحاسبة العملات الرقمية، وخطط الادخار. كلها مجانية في مكان واحد.",
      keywords: "حاسبة الذهب, حاسبة زكاة الذهب, محول عملات",
      path: "/tools",
    }),
  component: ToolsPage,
});

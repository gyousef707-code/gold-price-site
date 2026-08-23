import { createFileRoute } from "@tanstack/react-router";
import BlogListPage from "@/legacy/pages/BlogListPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () =>
    seoMeta({
      title: "مدونة ذهبي | مقالات عن الذهب والاستثمار",
      description:
        "مقالات ذهبي: كل ما تحتاج معرفته عن اسعار الذهب، الفضة، الزكاة، والاستثمار في مصر.",
      keywords: "مقالات عن الذهب, مدونة ذهبي",
      path: "/blog",
    }),
  component: BlogListPage,
});

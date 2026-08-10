import { createFileRoute } from "@tanstack/react-router";
import AboutPage from "@/legacy/pages/AboutPage.jsx";
import { staticPages } from "@/legacy/data/staticPages.js";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seoMeta({
      title: (staticPages as any).about.title,
      description: (staticPages as any).about.description,
      path: "/about",
    }),
  component: AboutPage,
});

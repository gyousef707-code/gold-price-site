import { createFileRoute } from "@tanstack/react-router";
import ContactPage from "@/legacy/pages/ContactPage.jsx";
import { staticPages } from "@/legacy/data/staticPages.js";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    seoMeta({
      title: (staticPages as any).contact.title,
      description: (staticPages as any).contact.description,
      path: "/contact",
    }),
  component: ContactPage,
});

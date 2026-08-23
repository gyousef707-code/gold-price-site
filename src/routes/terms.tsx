import { createFileRoute } from "@tanstack/react-router";
import TermsPage from "@/legacy/pages/TermsPage.jsx";
import { staticPages } from "@/legacy/data/staticPages.js";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    seoMeta({
      title: (staticPages as any).terms.title,
      description: (staticPages as any).terms.description,
      path: "/terms",
    }),
  component: TermsPage,
});

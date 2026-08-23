import { createFileRoute } from "@tanstack/react-router";
import PrivacyPage from "@/legacy/pages/PrivacyPage.jsx";
import { staticPages } from "@/legacy/data/staticPages.js";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    seoMeta({
      title: (staticPages as any).privacy.title,
      description: (staticPages as any).privacy.description,
      path: "/privacy",
    }),
  component: PrivacyPage,
});

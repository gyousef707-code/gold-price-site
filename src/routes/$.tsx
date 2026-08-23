import { createFileRoute } from "@tanstack/react-router";
import NotFoundPage from "@/legacy/pages/NotFoundPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/$")({
  head: () => ({
    ...seoMeta({
      title: "الصفحة غير موجودة | ذهبي",
      description: "الصفحة اللي بتدور عليها مش موجودة أو اتنقلت.",
      path: "/404",
    }),
    meta: [
      ...seoMeta({ title: "الصفحة غير موجودة | ذهبي", description: "الصفحة اللي بتدور عليها مش موجودة أو اتنقلت.", path: "/404" }).meta,
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFoundPage,
});

import { createFileRoute } from "@tanstack/react-router";
import BlogPostPage from "@/legacy/pages/BlogPostPage.jsx";
import { blogPosts } from "@/legacy/data/blog.js";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = (blogPosts as any[]).find((p) => p.slug === params.slug);
    return seoMeta({
      title: post?.title ?? "مقال | ذهبي",
      description: post?.description ?? "مقالات ذهبي عن الذهب والفضة والاستثمار في مصر.",
      path: `/blog/${params.slug}`,
      type: "article",
    });
  },
  component: BlogPostPage,
});

import { createFileRoute } from "@tanstack/react-router";
import GoldKaratPage from "@/legacy/pages/GoldKaratPage.jsx";
import { goldKarats } from "@/legacy/data/gold.js";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/gold/$karat")({
  head: ({ params }) => {
    const info = (goldKarats as any[]).find((k) => String(k.karat) === params.karat);
    return seoMeta({
      title: info?.title ?? `سعر الذهب عيار ${params.karat} | ذهبي`,
      description:
        info?.description ?? `سعر جرام الذهب عيار ${params.karat} اليوم في مصر بيع وشراء لحظة بلحظة.`,
      path: `/gold/${params.karat}`,
      type: "article",
    });
  },
  component: GoldKaratPage,
});

import { createFileRoute } from "@tanstack/react-router";
import GoldKaratPage from "@/legacy/pages/GoldKaratPage.jsx";
import GoldPoundPage from "@/legacy/pages/GoldPoundPage.jsx";
import { goldKarats } from "@/legacy/data/gold.js";
import { seoMeta } from "@/lib/seo";

// /gold/pound هي صفحة الجنيه الذهب، وأي قيمة تانية هي عيار (24, 22, 21 ...)
function GoldKaratOrPound() {
  const { karat } = Route.useParams();
  return karat === "pound" ? <GoldPoundPage /> : <GoldKaratPage />;
}

export const Route = createFileRoute("/gold/$karat")({
  head: ({ params }) => {
    if (params.karat === "pound") {
      return seoMeta({
        title: "سعر الجنيه الذهب اليوم في مصر | ذهبي",
        description:
          "سعر الجنيه الذهب (8 جرام عيار 21) اليوم في مصر بيع وشراء لحظة بلحظة، مع رسم بياني لتطور السعر.",
        path: "/gold/pound",
        type: "article",
      });
    }
    const info = (goldKarats as any[]).find((k) => String(k.karat) === params.karat);
    return seoMeta({
      title: info?.title ?? `سعر الذهب عيار ${params.karat} | ذهبي`,
      description:
        info?.description ?? `سعر جرام الذهب عيار ${params.karat} اليوم في مصر بيع وشراء لحظة بلحظة.`,
      path: `/gold/${params.karat}`,
      type: "article",
    });
  },
  component: GoldKaratOrPound,
});

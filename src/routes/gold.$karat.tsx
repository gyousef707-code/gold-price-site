import { createFileRoute } from "@tanstack/react-router";
import GoldKaratPage from "@/legacy/pages/GoldKaratPage.jsx";
import GoldPoundPage from "@/legacy/pages/GoldPoundPage.jsx";
import GoldBarsPage from "@/legacy/pages/GoldBarsPage.jsx";
import { goldKarats } from "@/legacy/data/gold.js";
import { seoMeta } from "@/lib/seo";

// /gold/pound هي صفحة الجنيه الذهب، و/gold/bars صفحة سبائك الذهب، وأي قيمة تانية هي عيار (24, 22, 21 ...)
function GoldKaratOrPound() {
  const { karat } = Route.useParams();
  if (karat === "pound") return <GoldPoundPage />;
  if (karat === "bars") return <GoldBarsPage />;
  return <GoldKaratPage />;
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
    if (params.karat === "bars") {
      return seoMeta({
        title: "سعر سبائك الذهب اليوم في مصر | 1 و5 و10 و50 و100 جرام | ذهبي",
        description:
          "سعر سبائك الذهب عيار 24 اليوم في مصر بكل الأوزان (1 و2.5 و5 و10 و20 و50 و100 جرام والأونصة) بيع وشراء لحظة بلحظة، مع حاسبة لأي وزن.",
        keywords: "سعر سبائك الذهب, سعر سبيكة الذهب اليوم, سبائك الذهب في مصر, سعر سبيكة 10 جرام",
        path: "/gold/bars",
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

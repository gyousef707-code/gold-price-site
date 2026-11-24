import { createFileRoute } from "@tanstack/react-router";
import MakingChargesPage from "@/legacy/pages/MakingChargesPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/tools_/making-charges")({
  head: () =>
    seoMeta({
      title: "حاسبة سعر الذهب بالمصنعية | احسب سعر القطعة قبل الشراء | ذهبي",
      description:
        "اعرف سعر الذهب بالمصنعية: اكتب الوزن والعيار والمصنعية عن الجرام وهتعرف السعر النهائي للقطعة على سعر الذهب اليوم في مصر، مع شرح المصنعية وأسئلة شائعة.",
      keywords: "سعر مصنعية الذهب, سعر الذهب بالمصنعية, حاسبة المصنعية, مصنعية الذهب",
      path: "/tools/making-charges",
    }),
  component: MakingChargesPage,
});

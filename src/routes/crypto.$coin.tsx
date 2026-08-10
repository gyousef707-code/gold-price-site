import { createFileRoute } from "@tanstack/react-router";
import CryptoCoinPage from "@/legacy/pages/CryptoCoinPage.jsx";
import { cryptoDetails } from "@/legacy/data/crypto.js";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/crypto/$coin")({
  head: ({ params }) => {
    const info = (cryptoDetails as any[]).find((c) => c.id === params.coin);
    return seoMeta({
      title: info?.title ?? "عملة رقمية | ذهبي",
      description: info?.description ?? "سعر العملة الرقمية بالجنيه المصري والدولار لحظة بلحظة.",
      path: `/crypto/${params.coin}`,
      type: "article",
    });
  },
  component: CryptoCoinPage,
});

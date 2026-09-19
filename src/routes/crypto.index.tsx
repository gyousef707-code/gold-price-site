import { createFileRoute } from "@tanstack/react-router";
import CryptoPage from "@/legacy/pages/CryptoPage.jsx";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/crypto/")({
  head: () =>
    seoMeta({
      title: "اسعار العملات الرقمية اليوم | ذهبي",
      description:
        "تابع اعلى 20 عملة رقمية بالجنيه المصري والدولار لحظة بلحظة: بيتكوين، إيثيريوم، تيثر وأكتر.",
      keywords: "اسعار العملات الرقمية, سعر بيتكوين اليوم, سعر إيثيريوم",
      path: "/crypto",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "اسعار العملات الرقمية اليوم",
            dateModified: new Date().toISOString(),
          }),
        }}
      />
      <CryptoPage />
    </>
  );
}

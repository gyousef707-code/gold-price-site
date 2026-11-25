import { createFileRoute } from "@tanstack/react-router";
import CurrenciesPage from "@/legacy/pages/CurrenciesPage.jsx";
import { seoMeta, listBreadcrumbSchema } from "@/lib/seo";

export const Route = createFileRoute("/currencies")({
  head: () => ({
    ...seoMeta({
      title: "اسعار العملات اليوم في مصر | ذهبي",
      description:
        "تابع اسعار العملات اليوم بالجنيه المصري لحظة بلحظة، ومحول عملات مجاني بين أكتر من 14 عملة.",
      keywords: "اسعار العملات, سعر الدولار اليوم, سعر اليورو",
      path: "/currencies",
    }),
    ...listBreadcrumbSchema("العملات", "/currencies"),
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
            name: "اسعار العملات اليوم في مصر",
            dateModified: new Date().toISOString(),
          }),
        }}
      />
      <CurrenciesPage />
    </>
  );
}

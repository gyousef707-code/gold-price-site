import { createFileRoute, useLoaderData, useParams } from "@tanstack/react-router";
import CountryCurrenciesPage from "@/legacy/pages/CountryCurrenciesPage.jsx";
import { countryLoader, countryMeta } from "@/lib/country-route";
import { seoMeta } from "@/lib/seo";

function Page() {
  const { country } = useParams({ from: "/$country/currencies" });
  const { initialData } = useLoaderData({ from: "/$country/currencies" });
  return <CountryCurrenciesPage code={country} initialData={initialData} />;
}

export const Route = createFileRoute("/$country/currencies")({
  loader: ({ params }) => countryLoader(params.country, "currencies"),
  head: ({ params }) => {
    const c = countryMeta(params.country);
    if (!c) return {};
    return seoMeta({
      title: `أسعار العملات اليوم في ${c.name} مقابل ${c.cur} | ذهبي`,
      description: `أسعار الدولار واليورو والعملات العربية مقابل ${c.currencyName} في ${c.name} لحظة بلحظة، مع محوّل عملات سريع.`,
      keywords: `سعر الدولار في ${c.name}, أسعار العملات ${c.name}, تحويل العملات ${c.currencyName}`,
      path: `/${c.code}/currencies`,
      type: "article",
    });
  },
  component: Page,
});

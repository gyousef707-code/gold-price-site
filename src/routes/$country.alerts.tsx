import { createFileRoute, useParams, notFound } from "@tanstack/react-router";
import CountryAlertsPage from "@/legacy/pages/CountryAlertsPage";
import { countryMeta, isCountry } from "@/lib/country-route";
import { seoMeta } from "@/lib/seo";

function Page() {
  const { country } = useParams({ from: "/$country/alerts" });
  return <CountryAlertsPage code={country} />;
}

export const Route = createFileRoute("/$country/alerts")({
  loader: ({ params }) => {
    if (!isCountry(params.country)) throw notFound();
    return null;
  },
  head: ({ params }) => {
    const c = countryMeta(params.country);
    if (!c) return {};
    return seoMeta({
      title: `تنبيهات أسعار الذهب والفضة في ${c.name} | ذهبي`,
      description: `اضبط تنبيهك لسعر الذهب والفضة في ${c.name} بـ${c.currencyName} وهيوصلك إشعار لما السعر يوصل هدفك.`,
      keywords: `تنبيه سعر الذهب ${c.name}, اشعارات اسعار الذهب ${c.name}`,
      path: `/${c.code}/alerts`,
    });
  },
  component: Page,
});

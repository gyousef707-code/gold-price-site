import { createFileRoute, useLoaderData, useParams } from "@tanstack/react-router";
import CountryPage from "@/legacy/pages/CountryPage.jsx";
import { countryLoader, countryMeta } from "@/lib/country-route";
import { seoMeta } from "@/lib/seo";

function Page() {
  const { country } = useParams({ from: "/$country/" });
  const { initialData } = useLoaderData({ from: "/$country/" });
  return <CountryPage code={country} initialData={initialData} />;
}

export const Route = createFileRoute("/$country/")({
  loader: ({ params }) => countryLoader(params.country, "gold"),
  head: ({ params }) => {
    const c = countryMeta(params.country);
    if (!c) return {};
    return seoMeta({
      title: `سعر الذهب اليوم في ${c.name} بـ${c.cur} | ذهبي`,
      description: `سعر جرام الذهب اليوم في ${c.name}: عيار 24 و22 و21 و18 بـ${c.currencyName} لحظة بلحظة، محسوب من السعر العالمي، مع سعر الأونصة وسعر الفضة.`,
      keywords: `سعر الذهب في ${c.name}, سعر الذهب اليوم ${c.name}, سعر جرام الذهب عيار 21 ${c.name}`,
      path: `/${c.code}`,
      type: "article",
    });
  },
  component: Page,
});

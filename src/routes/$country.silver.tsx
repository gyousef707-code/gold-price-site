import { createFileRoute, useLoaderData, useParams } from "@tanstack/react-router";
import CountrySilverPage from "@/legacy/pages/CountrySilverPage.jsx";
import { countryLoader, countryMeta } from "@/lib/country-route";
import { seoMeta } from "@/lib/seo";

function Page() {
  const { country } = useParams({ from: "/$country/silver" });
  const { initialData } = useLoaderData({ from: "/$country/silver" });
  return <CountrySilverPage code={country} initialData={initialData} />;
}

export const Route = createFileRoute("/$country/silver")({
  loader: ({ params }) => countryLoader(params.country, "gold"),
  head: ({ params }) => {
    const c = countryMeta(params.country);
    if (!c) return {};
    return seoMeta({
      title: `سعر الفضة اليوم في ${c.name} بـ${c.cur} | ذهبي`,
      description: `سعر جرام الفضة اليوم في ${c.name} بـ${c.currencyName}: فضة 999 و925 و900 و800 لحظة بلحظة، محسوب من السعر العالمي للأونصة.`,
      keywords: `سعر الفضة في ${c.name}, سعر جرام الفضة اليوم ${c.name}, فضة 925 ${c.name}`,
      path: `/${c.code}/silver`,
      type: "article",
    });
  },
  component: Page,
});

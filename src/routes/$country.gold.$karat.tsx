import { createFileRoute, notFound, useLoaderData, useParams } from "@tanstack/react-router";
import CountryKaratPage from "@/legacy/pages/CountryKaratPage.jsx";
import { countryLoader, countryMeta } from "@/lib/country-route";
import { seoMeta } from "@/lib/seo";

const KARATS = ["24", "22", "21", "18", "14", "12"];

function Page() {
  const { country, karat } = useParams({ from: "/$country/gold/$karat" });
  const { initialData } = useLoaderData({ from: "/$country/gold/$karat" });
  return <CountryKaratPage code={country} karat={Number(karat)} initialData={initialData} />;
}

export const Route = createFileRoute("/$country/gold/$karat")({
  beforeLoad: ({ params }) => {
    if (!KARATS.includes(params.karat)) throw notFound();
  },
  loader: ({ params }) => countryLoader(params.country, "gold"),
  head: ({ params }) => {
    const c = countryMeta(params.country);
    if (!c || !KARATS.includes(params.karat)) return {};
    const k = params.karat;
    return seoMeta({
      title: `سعر الذهب عيار ${k} اليوم في ${c.name} بـ${c.cur} | ذهبي`,
      description: `سعر جرام الذهب عيار ${k} اليوم في ${c.name} بـ${c.currencyName} لحظة بلحظة، مع سعر 5 و10 و20 جرام والأونصة وحاسبة مجانية.`,
      keywords: `سعر الذهب عيار ${k} ${c.name}, سعر جرام الذهب عيار ${k} اليوم ${c.name}, سعر الذهب ${c.name} ${c.currencyName}`,
      path: `/${c.code}/gold/${k}`,
      type: "article",
    });
  },
  component: Page,
});

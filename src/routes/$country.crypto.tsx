import { createFileRoute, useLoaderData, useParams } from "@tanstack/react-router";
import CountryCryptoPage from "@/legacy/pages/CountryCryptoPage.jsx";
import { countryLoader, countryMeta } from "@/lib/country-route";
import { seoMeta } from "@/lib/seo";

function Page() {
  const { country } = useParams({ from: "/$country/crypto" });
  const { initialData } = useLoaderData({ from: "/$country/crypto" });
  return <CountryCryptoPage code={country} initialData={initialData} />;
}

export const Route = createFileRoute("/$country/crypto")({
  loader: ({ params }) => countryLoader(params.country, "crypto"),
  head: ({ params }) => {
    const c = countryMeta(params.country);
    if (!c) return {};
    return seoMeta({
      title: `أسعار العملات الرقمية اليوم في ${c.name} ${c.inCur} | ذهبي`,
      description: `سعر البيتكوين والإيثيريوم وأعلى 20 عملة رقمية ${c.inCur} في ${c.name}، محسوبة من السعر العالمي بالدولار.`,
      keywords: `سعر البيتكوين في ${c.name}, العملات الرقمية ${c.name}, سعر الإيثيريوم ${c.inCur}`,
      path: `/${c.code}/crypto`,
      type: "article",
    });
  },
  component: Page,
});

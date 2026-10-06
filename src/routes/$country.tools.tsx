import { createFileRoute, useLoaderData, useParams } from "@tanstack/react-router";
import CountryToolsPage from "@/legacy/pages/CountryToolsPage.jsx";
import { countryLoader, countryMeta } from "@/lib/country-route";
import { seoMeta } from "@/lib/seo";

function Page() {
  const { country } = useParams({ from: "/$country/tools" });
  const { initialData } = useLoaderData({ from: "/$country/tools" });
  return <CountryToolsPage code={country} initialData={initialData} />;
}

export const Route = createFileRoute("/$country/tools")({
  loader: ({ params }) => countryLoader(params.country, "gold"),
  head: ({ params }) => {
    const c = countryMeta(params.country);
    if (!c) return {};
    return seoMeta({
      title: `حاسبة الذهب والفضة والزكاة في ${c.name} | ذهبي`,
      description: `حاسبات مجانية في ${c.name}: قيمة الذهب والفضة بالوزن والعيار، وزكاة الذهب، كلها بـ${c.currencyName}.`,
      keywords: `حاسبة الذهب ${c.name}, حاسبة الزكاة ${c.name}, حاسبة الفضة ${c.currencyName}`,
      path: `/${c.code}/tools`,
      type: "article",
    });
  },
  component: Page,
});

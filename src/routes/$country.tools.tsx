import { createFileRoute, useParams } from "@tanstack/react-router";
import CountryToolsPage from "@/legacy/pages/CountryToolsPage.jsx";
import { countryMeta } from "@/lib/country-route";
import { seoMeta } from "@/lib/seo";

function Page() {
  const { country } = useParams({ from: "/$country/tools" });
  return <CountryToolsPage code={country} />;
}

export const Route = createFileRoute("/$country/tools")({
  head: ({ params }) => {
    const c = countryMeta(params.country);
    if (!c) return {};
    return seoMeta({
      title: `الأدوات والحاسبات في ${c.name}: ذهب وفضة وزكاة | ذهبي`,
      description: `حاسبات مجانية في ${c.name}: قيمة الذهب والفضة بالوزن والعيار، وزكاة الذهب، كلها بـ${c.currencyName}.`,
      keywords: `حاسبة الذهب ${c.name}, حاسبة الزكاة ${c.name}, حاسبة الفضة ${c.currencyName}`,
      path: `/${c.code}/tools`,
      type: "article",
    });
  },
  component: Page,
});

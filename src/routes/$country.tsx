import { createFileRoute, notFound } from "@tanstack/react-router";
import CountryPage from "@/legacy/pages/CountryPage.jsx";
import { getCountry } from "@/legacy/data/countries.js";
import { getCountryPrices } from "@/lib/country-prices.server";
import { seoMeta } from "@/lib/seo";

// نفس فكرة الصفحة الرئيسية: لو السعر جه بسرعة (أقل من ثانية) بنبعته مع الصفحة
// عشان يظهر فوراً، ولو اتأخر الصفحة تتبعت عادي والمتصفح يجيبه بنفسه.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

function CountryRoute() {
  const { country } = Route.useParams();
  const { initialData } = Route.useLoaderData();
  return <CountryPage code={country} initialData={initialData} />;
}

export const Route = createFileRoute("/$country")({
  loader: async ({ params }) => {
    const c = getCountry(params.country);
    if (!c) throw notFound();
    try {
      const initialData = await withTimeout(getCountryPrices(params.country), 1000);
      return { initialData };
    } catch {
      return { initialData: null };
    }
  },
  head: ({ params }) => {
    const c: any = getCountry(params.country);
    if (!c) return {};
    return seoMeta({
      title: `سعر الذهب اليوم في ${c.name} بال${c.currencyName.split(" ")[0]} | ذهبي`,
      description: `سعر جرام الذهب اليوم في ${c.name}: عيار 24 و22 و21 و18 بـ${c.currencyName} لحظة بلحظة، محسوب من السعر العالمي، مع سعر الأونصة وسعر الفضة.`,
      keywords: `سعر الذهب في ${c.name}, سعر الذهب اليوم ${c.name}, سعر جرام الذهب عيار 21 ${c.name}`,
      path: `/${c.code}`,
      type: "article",
    });
  },
  component: CountryRoute,
});

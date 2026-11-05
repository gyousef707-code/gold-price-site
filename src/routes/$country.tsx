import { createFileRoute, notFound, Outlet, useParams } from "@tanstack/react-router";
import { getCountry, countryThemeCss } from "@/legacy/data/countries.js";
import { isCountry } from "@/lib/country-route";

// غلاف الدولة: بيتأكد إن الدولة مفعّلة، وبيطبّق ثيمها (ألوان + خلفية) على كل صفحاتها
// بما فيها الهيدر والقائمة السفلية.
function CountryLayout() {
  const { country } = useParams({ from: "/$country" });
  const c = getCountry(country);
  return (
    <>
      {c ? <style dangerouslySetInnerHTML={{ __html: countryThemeCss(c) }} /> : null}
      <Outlet />
    </>
  );
}

export const Route = createFileRoute("/$country")({
  beforeLoad: ({ params }) => {
    if (!isCountry(params.country)) throw notFound();
  },
  component: CountryLayout,
});

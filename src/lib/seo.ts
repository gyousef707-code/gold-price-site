import { SITE_URL } from "./site";
import { COUNTRY_CODES } from "@/legacy/data/countryCodes.js";
import { breadcrumbJsonLd } from "./jsonld.js";

// صفحات الذهب والفضة والعملات... ليها نظير في كل دولة وفي مصر.
// الجزء ده بيقول لجوجل إن النسخ دي لنفس الصفحة بس لكل بلد (hreflang)،
// عشان يعرض لكل زائر نسخة بلده.
const SAME_PAGE_FAMILY = /^(?:\/gold\/(?:24|22|21|18|14|12)|\/silver|\/currencies|\/crypto|\/tools|\/alerts)?$/;

function parsePath(path: string) {
  const m = path.match(/^\/([a-z]{2})(\/.*)?$/);
  if (m && COUNTRY_CODES.includes(m[1])) return { code: m[1] as string | null, rest: m[2] ?? "" };
  return { code: null as string | null, rest: path === "/" ? "" : path };
}

function alternateLinks(rest: string) {
  if (!SAME_PAGE_FAMILY.test(rest)) return [];
  const egypt = SITE_URL + (rest || "/");
  return [
    { rel: "alternate", hrefLang: "ar-EG", href: egypt },
    ...COUNTRY_CODES.map((c: string) => ({
      rel: "alternate",
      hrefLang: `ar-${c.toUpperCase()}`,
      href: `${SITE_URL}/${c}${rest}`,
    })),
    { rel: "alternate", hrefLang: "x-default", href: egypt },
  ];
}

export function seoMeta({
  title,
  description,
  keywords,
  path = "/",
  type = "website",
}: {
  title: string;
  description: string;
  keywords?: string;
  path?: string;
  type?: string;
}) {
  const url = SITE_URL + path;
  const { code, rest } = parsePath(path);
  const image = `${SITE_URL}/og-image.jpg`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(keywords ? [{ name: "keywords", content: keywords }] : []),
      { property: "og:type", content: type },
      { property: "og:site_name", content: "ذهبي" },
      { property: "og:locale", content: code ? `ar_${code.toUpperCase()}` : "ar_EG" },
      { property: "og:url", content: url },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }, ...alternateLinks(rest)],
  };
}

// بيرجع كود JSON-LD (Schema.org) بيقول لجوجل صراحة إمتى آخر مرة الصفحة
// دي اتحدثت فيها البيانات، عشان يظهر "قبل كذا دقيقة" في نتيجة البحث
// (Freshness signal) زي المواقع المنافسة بالظبط.
export function freshnessSchema(updatedAt: string) {
  return {
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          dateModified: updatedAt,
        }),
      },
    ],
  };
}

// مسار التنقل (الرئيسية › الدولة › الصفحة) لصفحات الدول، بيتحط في الـ <head> من السيرفر.
// لو label فاضي يبقى الصفحة هي صفحة الدولة نفسها (الرئيسية › الدولة بس).
export function countryBreadcrumbSchema(
  c: { code: string; name: string },
  label?: string,
  subPath = "",
) {
  const items = [
    { name: "الرئيسية", path: "/" },
    { name: c.name, path: `/${c.code}` },
    ...(label ? [{ name: label, path: `/${c.code}${subPath}` }] : []),
  ];
  return {
    scripts: [{ type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd(items)) }],
  };
}

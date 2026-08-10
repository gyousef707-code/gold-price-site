const SITE_URL = "https://www.zahaby1.com";

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
  const image = `${SITE_URL}/og-image.jpg`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(keywords ? [{ name: "keywords", content: keywords }] : []),
      { property: "og:type", content: type },
      { property: "og:site_name", content: "ذهبي" },
      { property: "og:locale", content: "ar_EG" },
      { property: "og:url", content: url },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

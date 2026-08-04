import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://zahaby1.com';

export default function Seo({ title, description, keywords, path = '/', type = 'website' }) {
  const url = SITE_URL + path;
  const image = `${SITE_URL}/og-image.jpg`;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="ذهبي" />
      <meta property="og:locale" content="ar_EG" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}

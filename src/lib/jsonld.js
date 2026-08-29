// Structured data (schema.org / JSON-LD) helpers.
// كل الفانكشنز دي بترجع object جاهز يتحط جوه سكريبت type="application/ld+json"
// (زي اللي شغال بالفعل في ContactPage.jsx). الهدف: جوجل يقدر يفهم الصفحة
// كويس ويظهرها كـ rich result (breadcrumbs في نتيجة البحث، مقال بتاريخ نشر، إلخ).

const SITE_URL = "https://www.zahaby1.com";
const SITE_NAME = "ذهبي";
const LOGO_URL = `${SITE_URL}/logo.png`;

// بيانات المنظمة — بتتحط مرة واحدة بس في الصفحة (عادة في الـ Layout) عشان
// تعرّف جوجل بهوية الموقع نفسه.
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: "Zahaby",
    url: SITE_URL,
    logo: LOGO_URL,
    sameAs: ["https://t.me/zahaby1"],
  };
}

// بيانات الموقع ككل (اسمه ولغته) — بتتحط جنب الـ Organization في نفس المكان.
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ar-EG",
  };
}

// مسار التنقل (Home > Section > Page) — بيتحط في أي صفحة فرعية عندها
// breadcrumb ظاهر للمستخدم، عشان جوجل يعرض نفس المسار في نتيجة البحث.
// items: [{ name: 'الرئيسية', path: '/' }, { name: 'عيار 21', path: '/gold/21' }]
export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

// مقال مدونة — بيدي جوجل تاريخ النشر والوصف والمصدر (Organization)، وده
// بيحسّن ظهور المقال في نتائج البحث وفي جوجل نيوز/ديسكفر لو حصل.
export function articleJsonLd({ title, description, path, datePublished, dateModified }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}${path}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${path}` },
  };
}

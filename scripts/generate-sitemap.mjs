// يولّد public/sitemap.xml تلقائياً من ملفات البيانات (المقالات، العيارات، الدول، العملات، الكريبتو).
// التشغيل:  node scripts/generate-sitemap.mjs   (بيتشغل لوحده قبل كل build)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = (f) => import(join(root, "src/legacy/data", f));

const { SITE_URL } = { SITE_URL: "https://zahaby1.com" };
const { blogPosts } = await data("blog.js");
const { goldKarats } = await data("gold.js");
const { COUNTRY_CODES } = await data("countryCodes.js");
const { CURRENCY_ORDER } = await data("currencies.js");
const { cryptoDetails } = await data("crypto.js");

const coinId = (c) => c.slug ?? c.id;
const urls = [];
const add = (path, changefreq, priority, lastmod) =>
  urls.push({ path, changefreq, priority, lastmod });

// الصفحات الرئيسية (مصر)
add("/", "hourly", "1.0");
for (const cc of COUNTRY_CODES) add(`/${cc}`, "hourly", "0.8");
for (const p of ["/currencies", "/silver", "/crypto", "/tools"]) add(p, "hourly", "0.8");
add("/tools/zakat", "monthly", "0.7");
add("/tools/making-charges", "monthly", "0.7");
add("/blog", "weekly", "0.7");
for (const p of ["/about", "/contact", "/privacy", "/terms", "/disclaimer"]) add(p, "yearly", "0.3");

// العيارات + الجنيه الذهب
for (const k of goldKarats) add(`/gold/${k.karat}`, "hourly", "0.8");
add("/gold/pound", "hourly", "0.8");

for (const c of CURRENCY_ORDER) add(`/currency/${c}`, "hourly", "0.7");
for (const c of cryptoDetails) add(`/crypto/${coinId(c)}`, "hourly", "0.7");

// المقالات (من ملف blog.js)
for (const p of blogPosts) add(`/blog/${p.slug}`, "monthly", "0.6", p.date);

// صفحات الدول
for (const cc of COUNTRY_CODES) {
  for (const p of ["/crypto", "/currencies", "/silver", "/tools"]) add(`/${cc}${p}`, "hourly", "0.7");
  for (const k of goldKarats) add(`/${cc}/gold/${k.karat}`, "hourly", "0.7");
}

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${SITE_URL}${u.path}</loc>\n` +
        (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : "") +
        `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

writeFileSync(join(root, "public/sitemap.xml"), xml);
console.log(`sitemap: ${urls.length} urls`);

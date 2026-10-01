import { lazy, Suspense } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import JsonLd from '../components/JsonLd.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import useApiData from '../hooks/useApiData.js';
import { goldKaratsDesc } from '../data/gold.js';
import { breadcrumbJsonLd } from '@/lib/jsonld.js';

const PriceHistoryChart = lazy(() => import('../components/PriceHistoryChart.jsx'));

// صفحة الجنيه الذهب (/gold/pound) — نفس شكل صفحات العيارات.
// الجنيه = 8 جرام ذهب عيار 21، وأرشيف سعره (pound_sell) بيتسجل يوميًا أصلًا.
export default function GoldPoundPage() {
  const { data } = useApiData('/api/public/gold-price', { intervalMs: 60000 });

  const pound = data?.pound;
  const k21 = data?.caratPrices?.['21'];
  const fmt = (n) => (n != null ? Number(n).toLocaleString('en-US') : '—');

  return (
    <div className="page-wrap">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'الرئيسية', path: '/' },
          { name: 'الأدوات', path: '/tools' },
          { name: 'الجنيه الذهب', path: '/gold/pound' },
        ])}
      />

      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link> / <Link to="/tools">الأدوات</Link> / الجنيه الذهب
      </div>
      <span className="eyebrow">أسعار الذهب</span>
      <h1>سعر الجنيه الذهب اليوم في مصر</h1>

      <div className="live-cta">
        <div>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>البيع: {fmt(pound?.sell)} ج.م</p>
          <p style={{ margin: 0 }}>الشراء: {fmt(pound?.buy)} ج.م</p>
        </div>
        <Link to="/#tool-gold-calc" className="btn">احسب قيمة ذهبك</Link>
      </div>

      <Suspense fallback={null}>
        <PriceHistoryChart
          endpoint="/api/public/gold-history"
          titleAr="تطور سعر الجنيه الذهب"
          titleEn="Gold pound price trend"
          dataKey="pound_sell"
          livePrice={pound?.sell ?? null}
          tone="gold"
        />
      </Suspense>

      <p>
        الجنيه الذهب قطعة ذهب عيار 21 وزنها 8 جرامات، وهو من أكتر أشكال ادخار الذهب انتشارًا في مصر
        لأن سعره واضح وسهل في البيع والشراء.
      </p>
      <p>
        سعر الجنيه بيتحرك مع سعر جرام عيار 21 بشكل مباشر، لأن الجنيه ببساطة 8 جرامات منه، فأي تغيير في
        سعر الجرام بيتضاعف 8 مرات في سعر الجنيه.
      </p>

      <table className="spec-table">
        <tbody>
          <tr><th>الوزن</th><td>8 جرام</td></tr>
          <tr><th>العيار</th><td>21</td></tr>
          <tr><th>النقاء</th><td>87.5% (21 من أصل 24 جزء)</td></tr>
          <tr><th>الذهب الخالص فيه</th><td>7 جرام تقريبًا</td></tr>
          <tr>
            <th>سعر جرام عيار 21 × 8 (اليوم)</th>
            <td>{k21 ? `${fmt(k21.sell * 8)} ج.م` : '—'}</td>
          </tr>
        </tbody>
      </table>

      <p>
        سعر البيع هو اللي بتشتري بيه الجنيه من الصاغة، وسعر الشراء هو اللي الصايغ بيشتري بيه منك، والفرق
        بينهم هو هامش التاجر.
      </p>

      <RelatedArticles slugs={['gold-price-today-egypt', 'difference-21-24-karat']} />

      <div className="related-box">
        <h3>اقرأ أيضًا - أسعار العيارات</h3>
        <ul>
          {goldKaratsDesc.map((g) => (
            <li key={g.karat}><Link to={`/gold/${g.karat}`}>سعر عيار {g.karat} اليوم</Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

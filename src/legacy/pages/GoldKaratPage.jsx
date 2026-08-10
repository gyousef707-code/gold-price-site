import { Link, useParams, Navigate } from '@/lib/router-compat.jsx';
import Seo from '../components/Seo.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import useApiData from '../hooks/useApiData.js';
import { goldKarats, goldKaratsDesc } from '../data/gold.js';

const RELATED_BY_KARAT = {
  '24': ['gold-karat-types-explained', 'difference-21-24-karat'],
  '22': ['gold-karat-types-explained', 'gold-price-today-egypt'],
  '21': ['difference-21-24-karat', 'gold-price-today-egypt'],
  '18': ['gold-karat-types-explained', 'gold-vs-silver-investment'],
  '14': ['gold-karat-types-explained', 'why-gold-price-differs-shops'],
  '12': ['gold-karat-types-explained', 'why-gold-price-differs-shops'],
};

export default function GoldKaratPage() {
  const { karat } = useParams();
  const info = goldKarats.find((g) => g.karat === karat);
  const { data } = useApiData('/api/public/gold-price', { intervalMs: 60000 });

  if (!info) return <Navigate to="/tools" replace />;

  const price = data?.caratPrices?.[karat];
  const otherKarats = goldKaratsDesc.filter((g) => g.karat !== karat);

  return (
    <div className="page-wrap">
      <Seo title={info.title} description={info.description} path={`/gold/${karat}`} type="article" />

      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link> / <Link to="/tools">الأدوات</Link> / عيار {karat}
      </div>
      <span className="eyebrow">أسعار الذهب</span>
      <h1>{info.h1}</h1>

      <div className="live-cta">
        <div>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>
            البيع: {price ? price.sell.toLocaleString('en-US') : '—'} ج.م
          </p>
          <p style={{ margin: 0 }}>
            الشراء: {price ? price.buy.toLocaleString('en-US') : '—'} ج.م
          </p>
        </div>
        <Link to="/tools#tool-gold-calc" className="btn">احسب قيمة ذهبك</Link>
      </div>

      <p>{info.intro}</p>
      {info.detail && <p>{info.detail}</p>}

      {info.specRows.length > 0 && (
        <table className="spec-table">
          <tbody>
            {info.specRows.map(([label, value], i) => (
              <tr key={i}><th>{label}</th><td>{value}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <RelatedArticles slugs={RELATED_BY_KARAT[karat]} />

      <div className="related-box">
        <h3>اقرأ أيضًا - باقي العيارات</h3>
        <ul>
          {otherKarats.map((g) => (
            <li key={g.karat}><Link to={`/gold/${g.karat}`}>سعر عيار {g.karat} اليوم</Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

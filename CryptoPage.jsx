import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import NewsList from '../components/NewsList.jsx';
import useApiData from '../hooks/useApiData.js';

export default function CryptoPage() {
  const { data, loading, error } = useApiData('/api/crypto-price', { intervalMs: 60000 });

  return (
    <div className="page-wrap">
      <Seo
        title="اسعار العملات الرقمية اليوم | ذهبي"
        description="تابع اعلى 20 عملة رقمية بالجنيه المصري والدولار لحظة بلحظة: بيتكوين، إيثيريوم، تيثر وأكتر."
        keywords="اسعار العملات الرقمية, سعر بيتكوين اليوم, سعر إيثيريوم"
        path="/crypto"
      />

      <section>
        <div className="section-title-bar">
          <h2><i className="fa-brands fa-bitcoin" /> أعلى 20 عملة رقمية مقابل الجنيه المصري</h2>
        </div>
        {loading && <p className="loading-text">جارِ تحميل اسعار العملات الرقمية...</p>}
        {error && !loading && <p className="error-text">تعذر تحميل الأسعار حاليًا</p>}
        {data?.coins?.map((c) => (
          <Link key={c.id} to={`/crypto/${c.id}`} className="currency-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {c.image && <img src={c.image} alt={c.name} style={{ width: 26, height: 26, borderRadius: '50%' }} />}
              <div>
                <div className="currency-name">{c.name}</div>
                <div className="currency-code">{c.symbol}</div>
              </div>
            </div>
            <div className="currency-vals">
              <div>{c.price_egp?.toLocaleString('en-US')} ج.م</div>
              <div>${c.price_usd?.toLocaleString('en-US')}</div>
            </div>
          </Link>
        ))}
      </section>

      <RelatedArticles slugs={['gold-vs-silver-investment', 'gold-price-forecast-2026', 'beginners-guide-gold-investment']} />

      <NewsList />
    </div>
  );
}

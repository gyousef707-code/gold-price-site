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
          <h2><i className="fa-solid fa-coins" /> اعلى 20 عملة رقمية مقابل الجنيه المصري</h2>
        </div>
        {loading && <p className="crypto-list-loading">جارِ تحميل اسعار العملات الرقمية...</p>}
        {error && !loading && <p className="error-text">تعذر تحميل الأسعار حاليًا</p>}
        <div className="currency-list-new">
          {data?.coins?.map((c, i) => {
            const changeKnown = typeof c.change_24h === 'number';
            const isNeg = changeKnown && c.change_24h < 0;
            return (
              <Link key={c.id} to={`/crypto/${c.id}`} className="currency-card-new">
                <div className="currency-card-left">
                  <span className="crypto-card-rank">{i + 1}</span>
                  {c.image && <img className="crypto-card-icon" src={c.image} alt={c.symbol} loading="lazy" />}
                  <div className="currency-card-info">
                    <div className="currency-card-name">{c.name}</div>
                    <div className="currency-card-code">{c.symbol}</div>
                  </div>
                </div>
                <div className="crypto-card-right">
                  {changeKnown && (
                    <span className={`badge-change ${isNeg ? 'negative' : 'positive'}`}>
                      {isNeg ? '▼' : '▲'} {Math.abs(c.change_24h).toFixed(2)}%
                    </span>
                  )}
                  <span className="crypto-card-price-egp">{c.price_egp?.toLocaleString('en-US')} ج.م</span>
                  <span className="crypto-card-price-usd">${c.price_usd?.toLocaleString('en-US')}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <RelatedArticles slugs={['gold-vs-silver-investment', 'gold-price-forecast-2026', 'beginners-guide-gold-investment']} />

      <NewsList />
    </div>
  );
}

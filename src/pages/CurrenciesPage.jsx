import Seo from '../components/Seo.jsx';
import CurrencyConverter from '../components/CurrencyConverter.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import NewsList from '../components/NewsList.jsx';
import useApiData from '../hooks/useApiData.js';
import { CURRENCY_META, CURRENCY_ORDER } from '../data/currencies.js';

export default function CurrenciesPage() {
  const { data, loading, error } = useApiData('/api/currency-price', { intervalMs: 2 * 60000 });

  return (
    <div className="page-wrap">
      <Seo
        title="اسعار العملات اليوم في مصر | ذهبي"
        description="تابع اسعار العملات اليوم بالجنيه المصري لحظة بلحظة، ومحول عملات مجاني بين أكتر من 14 عملة."
        keywords="اسعار العملات, سعر الدولار اليوم, سعر اليورو"
        path="/currencies"
      />

      <section>
        <div className="section-title-bar">
          <h2><i className="fa-solid fa-right-left" /> محول العملات</h2>
        </div>
        <CurrencyConverter rates={data?.rates} />
      </section>

      <section>
        <div className="section-title-bar">
          <h2><i className="fa-solid fa-coins" /> اسعار العملات بالجنيه المصري</h2>
        </div>
        {loading && <p className="loading-text">جارِ تحميل الأسعار...</p>}
        {error && !loading && <p className="error-text">تعذر تحميل الأسعار حاليًا</p>}
        {CURRENCY_ORDER.map((code) => {
          const r = data?.rates?.[code];
          const meta = CURRENCY_META[code];
          return (
            <div key={code} className="currency-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={`https://flagcdn.com/24x18/${meta.flag}.png`} alt={code} />
                <div>
                  <div className="currency-name">{meta.name}</div>
                  <div className="currency-code">{code.toUpperCase()}</div>
                </div>
              </div>
              <div className="currency-vals">
                <div>شراء {r ? r.buy.toLocaleString('en-US') : '—'}</div>
                <div>بيع {r ? r.sell.toLocaleString('en-US') : '—'}</div>
              </div>
            </div>
          );
        })}
      </section>

      <RelatedArticles slugs={['gold-price-forecast-2026', 'why-gold-price-differs-shops', 'gold-price-today-egypt']} />

      <NewsList />
    </div>
  );
}

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
          <h2><i className="fa-solid fa-list" /> سعر صرف العملات بالجنيه المصري</h2>
        </div>
        {loading && <p className="loading-text">جارِ تحميل الأسعار...</p>}
        {error && !loading && <p className="error-text">تعذر تحميل الأسعار حاليًا</p>}
        <div className="currency-list-new">
          {CURRENCY_ORDER.map((code) => {
            const r = data?.rates?.[code];
            const meta = CURRENCY_META[code];
            return (
              <div key={code} className="currency-card-new">
                <div className="currency-card-left">
                  <div className="currency-card-flag">
                    <img src={`https://flagcdn.com/24x18/${meta.flag}.png`} width="24" height="18" alt={code} style={{ borderRadius: 4 }} />
                  </div>
                  <div className="currency-card-info">
                    <div className="currency-card-name">{meta.name}</div>
                    <div className="currency-card-code">{code.toUpperCase()}</div>
                  </div>
                </div>
                <div className="currency-card-right">
                  <div className="currency-card-price-box">
                    <div className="currency-card-price-label">شراء</div>
                    <div className="currency-card-price-value buy">{r ? r.buy.toLocaleString('en-US') : '—'}</div>
                  </div>
                  <div className="currency-card-price-box">
                    <div className="currency-card-price-label">بيع</div>
                    <div className="currency-card-price-value sell">{r ? r.sell.toLocaleString('en-US') : '—'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <RelatedArticles slugs={['gold-price-forecast-2026', 'why-gold-price-differs-shops', 'gold-price-today-egypt']} />

      <NewsList />
    </div>
  );
}

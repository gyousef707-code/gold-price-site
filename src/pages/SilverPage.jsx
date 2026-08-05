import Seo from '../components/Seo.jsx';
import TradingViewChart from '../components/TradingViewChart.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import NewsList from '../components/NewsList.jsx';
import useApiData from '../hooks/useApiData.js';

const CARAT_ORDER = ['999', '925', '900', '800', '720', '500'];

export default function SilverPage() {
  const { data, loading, error } = useApiData('/api/silver-price', { intervalMs: 5 * 60000 });

  return (
    <div className="page-wrap">
      <Seo
        title="سعر الفضة اليوم في مصر | ذهبي"
        description="تابع سعر الفضة اليوم في مصر لحظة بلحظة بكل العيارات: 999، 925، 900، 800، 720، 500، بيع وشراء."
        keywords="سعر الفضة اليوم, اسعار الفضة في مصر"
        path="/silver"
      />

      <section>
        <div className="ounce-card">
          <div className="ounce-top-row">
            <span className="ounce-header-label">XAG/USD - أونصة الفضة العالمية (لحظي)</span>
          </div>
          <div className="ounce-value">
            {data?.ounce_usd ? `$${Number(data.ounce_usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
          </div>
          <div className="ounce-footer">
            <span className="live-badge"><span className="live-dot" /> مباشر</span>
            <span className="market-badge">السوق مفتوح</span>
          </div>
        </div>

        {loading && <p className="loading-text">جارِ تحميل الأسعار...</p>}
        {error && !loading && <p className="error-text">تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.</p>}

        <div className="price-cards">
          {CARAT_ORDER.map((c) => {
            const p = data?.silverPrices?.[c];
            return (
              <div key={c} className="price-card">
                <div className="card-icon-top"><i className="fa-solid fa-gem" /></div>
                <div className="carat-title-top">عيار {c}</div>
                <div className="p-row">
                  <span className="p-label">البيع لك</span>
                  <span className="p-value sell-v">{p ? p.sell.toLocaleString('en-US') : '—'}</span>
                </div>
                <div className="p-row">
                  <span className="p-label">الشراء منك</span>
                  <span className="p-value buy-v">{p ? p.buy.toLocaleString('en-US') : '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <TradingViewChart symbol="OANDA:XAGUSD" id="tradingview-silver" />

      <RelatedArticles slugs={['gold-vs-silver-investment', 'gold-price-today-egypt', 'best-time-to-buy-gold']} />

      <NewsList />
    </div>
  );
}

import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import TradingViewChart from '../components/TradingViewChart.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import useApiData from '../hooks/useApiData.js';

const CARAT_ORDER = ['999', '925', '900', '800', '720', '500'];

function sharePriceCard(e, carat, sell, buy) {
  e.preventDefault();
  e.stopPropagation();
  const text = `سعر فضة عيار ${carat} اليوم: البيع ${sell} ج.م - الشراء ${buy} ج.م - عبر تطبيق ذهبي`;
  if (navigator.share) {
    navigator.share({ title: 'ذهبي', text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text);
    alert('تم نسخ السعر');
  }
}

export default function SilverPage() {
  const { data, loading, error } = useApiData('/api/silver-price', { intervalMs: 5 * 60000 });

  return (
    <div className="main-content">
      <Seo
        title="سعر الفضة اليوم في مصر | ذهبي"
        description="تابع سعر الفضة اليوم في مصر لحظة بلحظة بكل العيارات: 999، 925، 900، 800، 720، 500، بيع وشراء."
        keywords="سعر الفضة اليوم, اسعار الفضة في مصر"
        path="/silver"
      />

      <section className="global-ounce-section">
        <div className="ounce-card">
          <div className="ounce-header">
            <span>XAG/USD - اونصة الفضة العالمية (لحظي)</span>
          </div>
          <div className="ounce-price">
            {data?.ounce_usd ? `$${Number(data.ounce_usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
          </div>
          <div className="ounce-footer">
            <span className="live-pulse"><span className="update-dot" /> مباشر</span>
            <span className="market-status-badge open"><span className="market-status-dot" /> السوق مفتوح</span>
          </div>
        </div>
      </section>

      {loading && <p className="loading-text">جارِ تحميل الأسعار...</p>}
      {error && !loading && <p className="error-text">تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.</p>}

      <section className="carats-unified-section">
        <div className="silver-cards-grid">
          {CARAT_ORDER.map((c) => {
            const p = data?.silverPrices?.[c];
            return (
              <div key={c} className="silver-card clickable-card">
                <button
                  className="card-share-btn"
                  title="مشاركة السعر"
                  aria-label="مشاركة السعر"
                  onClick={(e) => sharePriceCard(e, c, p?.sell, p?.buy)}
                >
                  <i className="fa-solid fa-share-nodes" />
                </button>
                <Link to="/blog/gold-vs-silver-investment" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className="silver-card-icon-top"><i className="fa-solid fa-gem" /></div>
                  <div className="silver-carat-wrap">
                    <span className="silver-carat-label">عيار</span>
                    <span className="silver-carat-num">{c}</span>
                  </div>
                  <div className="silver-v-row">
                    <span className="silver-v-label">البيع لك</span>
                    <span className="silver-v-value sell-price">{p ? p.sell.toLocaleString('en-US') : '—'}</span>
                  </div>
                  <div className="silver-v-row">
                    <span className="silver-v-label">الشراء منك</span>
                    <span className="silver-v-value buy-price">{p ? p.buy.toLocaleString('en-US') : '—'}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <TradingViewChart symbol="OANDA:XAGUSD" id="tradingview-silver" />

      <RelatedArticles slugs={['gold-vs-silver-investment', 'gold-price-today-egypt', 'best-time-to-buy-gold']} />
    </div>
  );
}

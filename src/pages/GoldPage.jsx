import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import TradingViewChart from '../components/TradingViewChart.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import NewsList from '../components/NewsList.jsx';
import useApiData from '../hooks/useApiData.js';

const KARAT_ORDER = ['24', '22', '21', '18', '14', '12'];

function sharePriceCard(e, karat, sell, buy) {
  e.preventDefault();
  e.stopPropagation();
  const text = `سعر عيار ${karat} اليوم: البيع ${sell} ج.م - الشراء ${buy} ج.م - عبر تطبيق ذهبي`;
  if (navigator.share) {
    navigator.share({ title: 'ذهبي', text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text);
    alert('تم نسخ السعر');
  }
}

export default function GoldPage() {
  const { data, loading, error } = useApiData('/api/gold-price', { intervalMs: 45000 });
  const changePct = data?.ounce_change_percent != null ? Number(data.ounce_change_percent) : null;

  return (
    <div className="page-wrap">
      <Seo
        title="سعر الذهب اليوم في مصر | ذهبي"
        description="تابع سعر الذهب اليوم في مصر لحظة بلحظة: عيار 24 و21 و18 وكل العيارات، بيع وشراء، محدثة أوتوماتيك."
        keywords="سعر الذهب اليوم, اسعار الذهب في مصر, سعر الذهب عيار 21"
        path="/"
      />

      <section className="global-ounce-section">
        <div className="ounce-card">
          <div className="ounce-header">
            <span>XAU/USD - سعر الاونصة العالمية (لحظي)</span>
            {changePct != null && (
              <span className={`badge-change ${changePct >= 0 ? 'positive' : 'negative'}`}>
                {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
              </span>
            )}
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
        <div className="gold-cards-grid">
          {KARAT_ORDER.map((k) => {
            const p = data?.caratPrices?.[k];
            return (
              <div key={k} className={`gold-card clickable-card${k === '24' ? ' featured' : ''}`}>
                <button
                  className="card-share-btn"
                  title="مشاركة السعر"
                  aria-label="مشاركة السعر"
                  onClick={(e) => sharePriceCard(e, k, p?.sell, p?.buy)}
                >
                  <i className="fa-solid fa-share-nodes" />
                </button>
                <Link to={`/gold/${k}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className="gold-card-icon-top"><i className="fa-solid fa-coins" /></div>
                  <div className="gold-carat-wrap">
                    <span className="gold-carat-label">عيار</span>
                    <span className="gold-carat-num">{k}</span>
                  </div>
                  <div className="gold-v-row">
                    <span className="gold-v-label">البيع لك</span>
                    <span className="gold-v-value sell-price">{p ? p.sell.toLocaleString('en-US') : '—'}</span>
                  </div>
                  <div className="gold-v-row">
                    <span className="gold-v-label">الشراء منك</span>
                    <span className="gold-v-value buy-price">{p ? p.buy.toLocaleString('en-US') : '—'}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {data?.pound && (
          <div className="ounce-card" style={{ marginBottom: 12 }}>
            <div className="ounce-header"><span>الجنيه ذهب</span></div>
            <div className="ounce-price" style={{ fontSize: 26 }}>
              {data.pound.sell.toLocaleString('en-US')} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>جنيه مصري</span>
            </div>
          </div>
        )}

        {data?.gap_value != null && (
          <div className="ounce-card" style={{ marginBottom: 12 }}>
            <div className="ounce-header"><span>مؤشر الفجوة السعرية (24)</span></div>
            <div className="gold-v-row">
              <span className="gold-v-label">دولار الصاغة</span>
              <span className="gold-v-value" style={{ fontSize: 16 }}>{data.implied_usd_rate}</span>
            </div>
            <div className="gold-v-row">
              <span className="gold-v-label">دولار البنك</span>
              <span className="gold-v-value" style={{ fontSize: 16 }}>{data.bank_usd_rate}</span>
            </div>
            <div className="gold-v-row">
              <span className="gold-v-label">قيمة الفجوة</span>
              <span className="gold-v-value" style={{ fontSize: 16 }}>{data.gap_value} ج.م</span>
            </div>
          </div>
        )}
      </section>

      <TradingViewChart symbol="OANDA:XAUUSD" id="tradingview-gold" />

      <RelatedArticles slugs={['gold-price-today-egypt', 'difference-21-24-karat', 'gold-zakat-calculation']} />

      <NewsList />
    </div>
  );
}

import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import TradingViewChart from '../components/TradingViewChart.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import NewsList from '../components/NewsList.jsx';
import useApiData from '../hooks/useApiData.js';
import { goldKarats } from '../data/gold.js';

const KARAT_ORDER = ['24', '22', '21', '18', '14', '12'];

export default function GoldPage() {
  const { data, loading, error } = useApiData('/api/gold-price', { intervalMs: 45000 });

  return (
    <div className="page-wrap">
      <Seo
        title="سعر الذهب اليوم في مصر | ذهبي"
        description="تابع سعر الذهب اليوم في مصر لحظة بلحظة: عيار 24 و21 و18 وكل العيارات، بيع وشراء، محدثة أوتوماتيك."
        keywords="سعر الذهب اليوم, اسعار الذهب في مصر, سعر الذهب عيار 21"
        path="/"
      />

      <section>
        <div className="ounce-card">
          <div className="ounce-top-row">
            {data?.ounce_change_percent != null && (
              <span className={`change-badge ${Number(data.ounce_change_percent) >= 0 ? 'up' : 'down'}`}>
                <i className={`fa-solid ${Number(data.ounce_change_percent) >= 0 ? 'fa-caret-up' : 'fa-caret-down'}`} />
                {Math.abs(Number(data.ounce_change_percent)).toFixed(2)}%
              </span>
            )}
            <span className="ounce-header-label">XAU/USD - سعر الأونصة العالمية (لحظي)</span>
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
          {KARAT_ORDER.map((k) => {
            const p = data?.caratPrices?.[k];
            return (
              <Link key={k} to={`/gold/${k}`} className={`price-card${k === '24' ? ' featured' : ''}`}>
                <div className="card-icon-top"><i className="fa-solid fa-coins" /></div>
                <div className="carat-title-top">عيار {k}</div>
                <div className="p-row">
                  <span className="p-label">البيع لك</span>
                  <span className="p-value sell-v">{p ? p.sell.toLocaleString('en-US') : '—'}</span>
                </div>
                <div className="p-row">
                  <span className="p-label">الشراء منك</span>
                  <span className="p-value buy-v">{p ? p.buy.toLocaleString('en-US') : '—'}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {data?.pound && (
          <div className="ounce-card" style={{ marginTop: 12 }}>
            <div className="ounce-header">الجنيه ذهب</div>
            <div className="ounce-value" style={{ fontSize: 20 }}>
              {data.pound.sell.toLocaleString('en-US')} جنيه مصري
            </div>
          </div>
        )}

        {data?.gap_value != null && (
          <div className="ounce-card" style={{ marginTop: 12 }}>
            <div className="ounce-header">مؤشر الفجوة السعرية (24)</div>
            <div className="p-row">
              <span className="p-label">دولار الصاغة</span>
              <span className="p-value">{data.implied_usd_rate}</span>
            </div>
            <div className="p-row">
              <span className="p-label">دولار البنك</span>
              <span className="p-value">{data.bank_usd_rate}</span>
            </div>
            <div className="p-row">
              <span className="p-label">قيمة الفجوة</span>
              <span className="p-value">{data.gap_value} ج.م</span>
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

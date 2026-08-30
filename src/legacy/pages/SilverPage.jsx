import TradingViewChart from '../components/TradingViewChart.jsx';
import HistoryTable from '../components/HistoryTable.jsx';
import FaIcon from '../components/FaIcon.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import LivePrice from '../components/LivePrice.jsx';
import UpdatedStamp from '../components/UpdatedStamp.jsx';
import MarketStatus from '../components/MarketStatus.jsx';

import SilverCalculator from '../components/calculators/SilverCalculator.jsx';
import SavingsCalculator from '../components/calculators/SavingsCalculator.jsx';
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';
import { shareCard } from '../lib/shareCard.js';

const CARAT_ORDER = ['999', '925', '900', '800', '720', '500'];

export default function SilverPage() {
  const { data, loading, error } = useApiData('/api/public/silver-price', { intervalMs: 5 * 60000 });
  const { t, lang } = useLang();

  const shareSilver = (e, carat, p) => {
    e.preventDefault();
    e.stopPropagation();
    shareCard(
      {
        title: lang === 'en' ? `Silver ${carat} price today` : `سعر الفضة عيار ${carat} اليوم`,
        subtitle: lang === 'en' ? 'Egypt — per gram' : 'مصر — سعر الجرام',
        rows: [
          { label: t('price.sell'), value: p ? `${p.sell.toLocaleString('en-US')} ج.م` : '—', color: '#3fb950' },
          { label: t('price.buy'), value: p ? `${p.buy.toLocaleString('en-US')} ج.م` : '—', color: '#f85149' },
          {
            label: lang === 'en' ? 'Global ounce' : 'الأونصة العالمية',
            value: data?.ounce_usd ? `$${Number(data.ounce_usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—',
          },
        ],
      },
      `سعر فضة عيار ${carat} اليوم: البيع ${p?.sell ?? '—'} ج.م - الشراء ${p?.buy ?? '—'} ج.م - عبر تطبيق ذهبي`
    );
  };

  return (
    <div className="page-wrap">
      <section className="global-ounce-section">
        <div className="ounce-card">
          <div className="ounce-header">
            <span>{t('silver.ounce')}</span>
          </div>
          <div className="ounce-price">
            <LivePrice value={data?.ounce_usd != null ? Number(data.ounce_usd) : null} prefix="$" decimals={2} live volatility={0.00015} tickMs={2400} />
          </div>
          <UpdatedStamp lang={lang} date={data?.updated_at} />
          <div className="ounce-footer">
            <span className="live-pulse"><span className="update-dot" /> {t('live')}</span>
            <MarketStatus lang={lang} />
          </div>
        </div>
      </section>


      {loading && <p className="loading-text">{t('loading')}</p>}
      {error && !loading && <p className="error-text">{t('error')}</p>}

      <section className="carats-unified-section">
        <div className="silver-cards-grid">
          {CARAT_ORDER.map((c) => {
            const p = data?.silverPrices?.[c];
            return (
              <div key={c} className="silver-card clickable-card">
                <button
                  className="card-share-btn"
                  title={t('share.price')}
                  aria-label={t('share.price')}
                  onClick={(e) => shareSilver(e, c, p)}
                >
                  <FaIcon icon="fa-solid fa-share-nodes" />
                </button>
                <div className="silver-card-icon-top"><FaIcon icon="fa-solid fa-gem" /></div>
                <div className="silver-carat-wrap">
                  <span className="silver-carat-label">{t('karat')}</span>
                  <span className="silver-carat-num">{c}</span>
                </div>
                <div className="silver-v-row">
                  <span className="silver-v-label">{t('price.sell')}</span>
                  <span className="silver-v-value sell-price">
                    <LivePrice value={p?.sell ?? null} decimals={0} />
                  </span>
                </div>
                <div className="silver-v-row">
                  <span className="silver-v-label">{t('price.buy')}</span>
                  <span className="silver-v-value buy-price">
                    <LivePrice value={p?.buy ?? null} decimals={0} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <HistoryTable
        endpoint="/api/public/silver-history"
        titleAr="تطور سعر الفضة خلال آخر 30 يوم"
        titleEn="Silver price history (last 30 days)"
        columns={[
          { key: 'silver999_sell', labelAr: 'عيار 999', labelEn: 'Purity 999' },
          { key: 'silver925_sell', labelAr: 'عيار 925', labelEn: 'Purity 925' },
        ]}
      />

      <TradingViewChart symbol="OANDA:XAGUSD" id="tradingview-silver" />

      <section id="tool-silver-calc" className="page-tools">
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-solid fa-calculator" /> {lang === 'en' ? 'Silver tools' : 'أدوات الفضة'}</h2>
        </div>
        <SilverCalculator />
        <div id="tool-silver-savings"><SavingsCalculator metal="silver" /></div>
      </section>

      <RelatedArticles slugs={['gold-vs-silver-investment', 'gold-price-today-egypt', 'best-time-to-buy-gold']} />

    </div>
  );
}

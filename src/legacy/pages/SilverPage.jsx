import { lazy, Suspense } from 'react';
import TradingViewChart from '../components/TradingViewChart.jsx';
const PriceHistoryChart = lazy(() => import('../components/PriceHistoryChart.jsx'));
import LazyOnView from '../components/LazyOnView.jsx';
import FaIcon from '../components/FaIcon.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import LivePrice from '../components/LivePrice.jsx';
import UpdatedStamp from '../components/UpdatedStamp.jsx';
import MarketStatus from '../components/MarketStatus.jsx';

import CalcTabs from '../components/CalcTabs.jsx';
const SilverCalculator = lazy(() => import('../components/calculators/SilverCalculator.jsx'));
const SavingsCalculator = lazy(() => import('../components/calculators/SavingsCalculator.jsx'));
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';
import { shareCard } from '../lib/shareCard.js';

const CARAT_ORDER = ['999', '925', '900', '800', '720', '500'];

export default function SilverPage() {
  const { data, loading, error } = useApiData('/api/public/silver-price', { intervalMs: 5 * 60000 });
  const { t, lang } = useLang();
  const changePct = data?.ounce_change_percent != null ? Number(data.ounce_change_percent) : null;

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
            {changePct != null && (
              <span className={`badge-change ${changePct >= 0 ? 'positive' : 'negative'}`}>
                {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
              </span>
            )}
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
                    <LivePrice value={p?.sell ?? null} decimals={0} skeleton />
                  </span>
                </div>
                {changePct != null && (
                  <span className={`card-change-badge ${changePct >= 0 ? 'positive' : 'negative'}`}>
                    {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
                  </span>
                )}
                <div className="silver-v-row">
                  <span className="silver-v-label">{t('price.buy')}</span>
                  <span className="silver-v-value buy-price">
                    <LivePrice value={p?.buy ?? null} decimals={0} skeleton />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <LazyOnView minHeight={290}>
        <Suspense fallback={null}>
          <PriceHistoryChart
            endpoint="/api/public/silver-history"
            titleAr="تطور سعر فضة عيار 999"
            titleEn="999 silver price trend"
            dataKey="silver999_sell"
            tone="silver"
          />
        </Suspense>
      </LazyOnView>

      <TradingViewChart symbol="OANDA:XAGUSD" id="tradingview-silver" />

      <section id="tool-silver-calc" className="page-tools">
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-solid fa-calculator" /> {lang === 'en' ? 'Silver tools' : 'أدوات الفضة'}</h2>
        </div>
        <CalcTabs
          tabs={[
            { id: 'tool-silver-calc-value', label: lang === 'en' ? 'Silver value' : 'قيمة الفضة', render: () => <SilverCalculator /> },
            { id: 'tool-silver-savings', label: lang === 'en' ? 'Savings' : 'الادخار', render: () => <SavingsCalculator metal="silver" /> },
          ]}
        />
      </section>

      <RelatedArticles slugs={['gold-vs-silver-investment', 'gold-price-today-egypt', 'best-time-to-buy-gold']} />

    </div>
  );
}

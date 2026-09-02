import { lazy, Suspense } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import FaIcon from '../components/FaIcon.jsx';
import TradingViewChart from '../components/TradingViewChart.jsx';
import LivePrice from '../components/LivePrice.jsx';
import UpdatedStamp from '../components/UpdatedStamp.jsx';
import MarketStatus from '../components/MarketStatus.jsx';
import GapGauge from '../components/GapGauge.jsx';
import HistoryTable from '../components/HistoryTable.jsx';

import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';
import { goldKaratsDesc } from '../data/gold.js';
import { shareCard } from '../lib/shareCard.js';

// الأجزاء دي تحت الشاشة الأولى (تحت السكرول)، فبنأجل تحميل الكود بتاعها
// لحد ما المستخدم يقرب منها فعلاً، بدل ما تتحمّل كلها من أول لحظة.
// الشكل والمحتوى النهائي بيفضلوا زي ما هم بالظبط.
const RelatedArticles = lazy(() => import('../components/RelatedArticles.jsx'));
const GoldCalculator = lazy(() => import('../components/calculators/GoldCalculator.jsx'));
const ZakatCalculator = lazy(() => import('../components/calculators/ZakatCalculator.jsx'));
const SavingsCalculator = lazy(() => import('../components/calculators/SavingsCalculator.jsx'));

const KARAT_ORDER = ['24', '22', '21', '18', '14', '12'];

export default function GoldPage({ initialGoldData = null } = {}) {
  const { data, loading, error } = useApiData('/api/public/gold-price', {
    intervalMs: 45000,
    initialData: initialGoldData,
  });
  const { t, lang } = useLang();
  const changePct = data?.ounce_change_percent != null ? Number(data.ounce_change_percent) : null;

  const shareKarat = (e, karat, p) => {
    e.preventDefault();
    e.stopPropagation();
    shareCard(
      {
        title: lang === 'en' ? `Gold ${karat}K price today` : `سعر الذهب عيار ${karat} اليوم`,
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
      `سعر عيار ${karat} اليوم: البيع ${p?.sell ?? '—'} ج.م - الشراء ${p?.buy ?? '—'} ج.م - عبر تطبيق ذهبي`
    );
  };

  const sharePound = (e) => {
    e.preventDefault();
    e.stopPropagation();
    shareCard(
      {
        title: t('gold.pound'),
        subtitle: lang === 'en' ? '8 grams of 21K gold' : '8 جرام ذهب عيار 21',
        rows: [
          { label: t('price.sell'), value: data?.pound ? `${data.pound.sell.toLocaleString('en-US')} ج.م` : '—', color: '#3fb950' },
          { label: t('price.buy'), value: data?.pound ? `${data.pound.buy.toLocaleString('en-US')} ج.م` : '—', color: '#f85149' },
        ],
      },
      `سعر الجنيه الذهب اليوم: ${data?.pound?.sell ?? '—'} ج.م - عبر تطبيق ذهبي`
    );
  };

  return (
    <div className="page-wrap">
      <section className="global-ounce-section">
        <div className="ounce-card">
          <div className="ounce-header">
            <span>{t('gold.ounce')}</span>
            {changePct != null && (
              <span className={`badge-change ${changePct >= 0 ? 'positive' : 'negative'}`}>
                {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
              </span>
            )}
          </div>
          <div className="ounce-price">
            <LivePrice value={data?.ounce_usd != null ? Number(data.ounce_usd) : null} prefix="$" decimals={2} live volatility={0.00012} tickMs={2400} />
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

      <section className="carats-unified-section gold-carats-section">
        <div className="gold-cards-grid">
          {KARAT_ORDER.map((k) => {
            const p = data?.caratPrices?.[k];
            return (
              <div key={k} className={`gold-card clickable-card${k === '21' ? ' featured hero-karat' : ''}`}>
                {k === '21' && <span className="gold-card-badge">{lang === 'en' ? 'MOST TRADED' : 'الأكثر تداولًا'}</span>}

                <button
                  className="card-share-btn"
                  title={t('share.price')}
                  aria-label={t('share.price')}
                  onClick={(e) => shareKarat(e, k, p)}
                >
                  <FaIcon icon="fa-solid fa-share-nodes" />
                </button>
                <Link to={`/gold/${k}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className="gold-card-icon-top"><FaIcon icon="fa-solid fa-coins" /></div>
                  <div className="gold-carat-wrap">
                    <span className="gold-carat-label">{t('karat')}</span>
                    <span className="gold-carat-num">{k}</span>
                  </div>
                  <div className="gold-v-row">
                    <span className="gold-v-label">{t('price.sell')}</span>
                    <span className="gold-v-value sell-price">
                      <LivePrice value={p?.sell ?? null} decimals={0} />
                    </span>
                  </div>
                  <div className="gold-v-row">
                    <span className="gold-v-label">{t('price.buy')}</span>
                    <span className="gold-v-value buy-price">
                      <LivePrice value={p?.buy ?? null} decimals={0} />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}

          {/* كارت الجنيه الذهب جنب عيار 12 و14 */}
          <div className="gold-card pound-card">
            <button
              className="card-share-btn"
              title={t('share.price')}
              aria-label={t('share.price')}
              onClick={sharePound}
            >
              <FaIcon icon="fa-solid fa-share-nodes" />
            </button>
            <div className="gold-card-icon-top"><FaIcon icon="fa-solid fa-sack-dollar" /></div>
            <div className="gold-carat-wrap pound-wrap">
              <span className="pound-title">{t('gold.pound')}</span>
            </div>
            <div className="gold-v-row">
              <span className="gold-v-label">{t('price.sell')}</span>
              <span className="gold-v-value sell-price">
                <LivePrice value={data?.pound?.sell ?? null} decimals={0} />
              </span>
            </div>
            <div className="gold-v-row">
              <span className="gold-v-label">{t('price.buy')}</span>
              <span className="gold-v-value buy-price">
                <LivePrice value={data?.pound?.buy ?? null} decimals={0} />
              </span>
            </div>
          </div>
        </div>

        {data?.gap_value != null && (
          <div className="ounce-card gap-card">
            <div className="ounce-header"><span>{t('gold.gap')}</span></div>
            <div className="gap-card-container">
              <div className="dollar-side-boxes">
                <div className="mini-dollar-box">
                  <div className="md-title">{t('gap.shops')}</div>
                  <div className="md-value">{Number(data.implied_usd_rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م</div>
                </div>
                <div className="mini-dollar-box">
                  <div className="md-title">{t('gap.bank')}</div>
                  <div className="md-value">{Number(data.bank_usd_rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م</div>
                </div>
              </div>
              <GapGauge value={data.gap_value} max={10} label={t('gap.value')} />
            </div>
          </div>
        )}

      </section>

      <HistoryTable
        endpoint="/api/public/gold-history"
        titleAr="تطور سعر الذهب خلال آخر 30 يوم"
        titleEn="Gold price history (last 30 days)"
        primaryKey="karat24_sell"
        columns={[
          { key: 'karat24_sell', labelAr: 'عيار 24', labelEn: 'Karat 24' },
          { key: 'karat21_sell', labelAr: 'عيار 21', labelEn: 'Karat 21' },
          { key: 'ounce_egp_sell', labelAr: 'الأونصة (ج.م)', labelEn: 'Ounce (EGP)' },
          { key: 'pound_sell', labelAr: 'جنيه الذهب', labelEn: 'Gold pound' },
        ]}
      />

      <TradingViewChart symbol="OANDA:XAUUSD" id="tradingview-gold" />

      <section id="tool-gold-calc" className="page-tools">
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-solid fa-calculator" /> {lang === 'en' ? 'Gold tools' : 'أدوات الذهب'}</h2>
        </div>
        <Suspense fallback={null}>
          <GoldCalculator />
          <div id="tool-zakat-calc"><ZakatCalculator /></div>
          <div id="tool-gold-savings"><SavingsCalculator metal="gold" /></div>
        </Suspense>
      </section>

      <section id="tool-gold-karats">
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-solid fa-coins" /> {lang === 'en' ? 'Gold karats in detail' : 'عيارات الذهب بالتفصيل'}</h2>
        </div>
        <div className="carat-grid">
          {goldKaratsDesc.map((g) => (
            <Link key={g.karat} to={`/gold/${g.karat}`}>{t('karat')} {g.karat}</Link>
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <RelatedArticles slugs={['gold-price-today-egypt', 'difference-21-24-karat', 'gold-zakat-calculation']} />
      </Suspense>
    </div>
  );
}

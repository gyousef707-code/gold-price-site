import { useMemo, useState } from 'react';
import FaIcon from '../components/FaIcon.jsx';
import { Link } from '@/lib/router-compat.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import NewsList from '../components/NewsList.jsx';
import LivePrice from '../components/LivePrice.jsx';
import UpdatedStamp from '../components/UpdatedStamp.jsx';
import CryptoCalculator from '../components/calculators/CryptoCalculator.jsx';
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';
import { cryptoDetails } from '../data/crypto.js';

const FALLBACK_ICON = (id) => `https://assets.coincap.io/assets/icons/${id}@2x.png`;

export default function CryptoPage() {
  const { data, loading, error } = useApiData('/api/public/crypto-price', { intervalMs: 60000 });
  const { t, lang } = useLang();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('rank');

  const coins = useMemo(() => {
    let list = (data?.coins || []).map((c, i) => ({ ...c, rank: i + 1 }));
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(s) || (c.symbol || '').toLowerCase().includes(s));
    }
    if (sort === 'gainers') list = [...list].sort((a, b) => (b.change_24h ?? -999) - (a.change_24h ?? -999));
    if (sort === 'losers') list = [...list].sort((a, b) => (a.change_24h ?? 999) - (b.change_24h ?? 999));
    if (sort === 'price') list = [...list].sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0));
    return list;
  }, [data, q, sort]);

  const top = coins[0];

  return (
    <div className="page-wrap">
      {top && (
        <section className="global-ounce-section">
          <div className="ounce-card">
            <div className="ounce-header">
              <span>
                <img className="crypto-card-icon inline-coin" src={top.image || FALLBACK_ICON(top.symbol?.toLowerCase())} alt={top.symbol} width="24" height="24" />
                {top.name} — {top.symbol}/USD
              </span>
              {typeof top.change_24h === 'number' && (
                <span className={`badge-change ${top.change_24h < 0 ? 'negative' : 'positive'}`}>
                  {top.change_24h < 0 ? '▼' : '▲'} {Math.abs(top.change_24h).toFixed(2)}%
                </span>
              )}
            </div>
            <div className="ounce-price">
              <LivePrice value={top.price_usd ?? null} prefix="$" decimals={2} live volatility={0.0002} tickMs={2200} />
            </div>
            <UpdatedStamp lang={lang} date={data?.updated_at} />
          </div>
        </section>
      )}

      <div className="crypto-legal-note">
        <FaIcon icon="fa-solid fa-circle-info" />
        <span>
          {lang === 'en'
            ? 'Informational only. Displayed prices are indicative market data from public sources. Trading or promoting cryptocurrencies is not licensed by the Central Bank of Egypt — this page offers no buying, selling, brokerage, investment advice or referral links.'
            : 'للأغراض المعلوماتية فقط. الأسعار المعروضة بيانات استرشادية من مصادر عامة. التعامل فى العملات الرقمية غير مرخّص من البنك المركزى المصرى — الصفحة دى مش بتقدّم بيع أو شراء أو وساطة أو نصائح استثمارية ولا روابط تحويل لأى منصة.'}
        </span>
      </div>


      <section>
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-brands fa-bitcoin" /> {t('crypto.top')}</h2>
        </div>

        <div className="crypto-toolbar">
          <div className="crypto-search">
            <FaIcon icon="fa-solid fa-magnifying-glass" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === 'en' ? 'Search a coin...' : 'دور على عملة...'}
              aria-label={lang === 'en' ? 'Search coins' : 'بحث عن عملة'}
            />
          </div>
          <div className="crypto-filters">
            {[
              ['rank', lang === 'en' ? 'Top' : 'الأعلى'],
              ['gainers', lang === 'en' ? 'Gainers' : 'الرابحة'],
              ['losers', lang === 'en' ? 'Losers' : 'الخاسرة'],
              ['price', lang === 'en' ? 'Price' : 'السعر'],
            ].map(([k, label]) => (
              <button key={k} type="button" className={`crypto-chip${sort === k ? ' active' : ''}`} onClick={() => setSort(k)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="crypto-list-loading">{t('loading')}</p>}
        {error && !loading && <p className="error-text">{t('error')}</p>}

        <div className="crypto-list">
          {coins.map((c) => {
            const changeKnown = typeof c.change_24h === 'number';
            const isNeg = changeKnown && c.change_24h < 0;
            return (
              <Link key={c.id} to={`/crypto/${c.id}`} className="crypto-row">
                <span className="crypto-card-rank">{c.rank}</span>
                <img
                  className="crypto-card-icon"
                  src={c.image || FALLBACK_ICON((c.symbol || '').toLowerCase())}
                  alt={c.symbol}
                  width="32"
                  height="32"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_ICON((c.symbol || '').toLowerCase());
                  }}
                />
                <div className="crypto-row-info">
                  <span className="crypto-row-name">{c.name}</span>
                  <span className="crypto-row-symbol">{c.symbol}</span>
                </div>
                <div className="crypto-row-prices">
                  <span className="crypto-card-price-usd">
                    <LivePrice value={c.price_usd ?? null} decimals={c.price_usd < 1 ? 4 : 2} prefix="$" live volatility={0.00018} tickMs={2600} />
                  </span>
                  <span className="crypto-card-price-egp">
                    <LivePrice value={c.price_egp ?? null} decimals={0} suffix=" ج.م" live volatility={0.00018} tickMs={2600} />
                  </span>
                </div>
                {changeKnown && (
                  <span className={`badge-change ${isNeg ? 'negative' : 'positive'}`}>
                    {isNeg ? '▼' : '▲'} {Math.abs(c.change_24h).toFixed(2)}%
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section id="tool-crypto-calc" className="page-tools">
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-solid fa-calculator" /> {lang === 'en' ? 'Crypto tools' : 'أدوات العملات الرقمية'}</h2>
        </div>
        <CryptoCalculator />
      </section>

      <section id="tool-crypto-details">
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-brands fa-bitcoin" /> {lang === 'en' ? 'Coins in detail' : 'العملات الرقمية بالتفصيل'}</h2>
        </div>
        <div className="crypto-grid">
          {cryptoDetails.map((c) => (
            <Link key={c.id} to={`/crypto/${c.id}`}>{c.h1.match(/\(([^)]+)\)/)?.[1] || c.id}</Link>
          ))}
        </div>
      </section>

      <RelatedArticles slugs={['gold-vs-silver-investment', 'gold-price-forecast-2026', 'beginners-guide-gold-investment']} />

      <NewsList />
    </div>
  );
}

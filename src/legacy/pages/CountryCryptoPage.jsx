import { lazy, useEffect, useMemo, useState } from 'react';
import FaIcon from '../components/FaIcon.jsx';
import LivePrice from '../components/LivePrice.jsx';
import LazyOnView from '../components/LazyOnView.jsx';
import useApiData from '../hooks/useApiData.js';
import CountryHero, { formatTime } from '../components/CountryHero.jsx';
import { COUNTRIES } from '../data/countries.js';

const CountryCryptoCalc = lazy(() =>
  import('../components/CountryCalculators.jsx').then((m) => ({ default: m.CountryCryptoCalc }))
);

// أيقونة احتياطية لو الصورة الأساسية مجتش (نفس اللي بتستخدمه صفحة مصر)
const FALLBACK_ICON = (symbol) => `https://assets.coincap.io/assets/icons/${(symbol || '').toLowerCase()}@2x.png`;

const FILTERS = [
  ['rank', 'الأعلى'],
  ['gainers', 'الرابحة'],
  ['losers', 'الخاسرة'],
  ['price', 'السعر'],
];

export default function CountryCryptoPage({ code, initialData = null }) {
  const c = COUNTRIES[code];
  const { data, loading, error } = useApiData(`/api/public/country-prices?c=${code}&t=crypto`, {
    intervalMs: 60000,
    initialData,
  });
  const [time, setTime] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('rank');

  useEffect(() => {
    setTime(formatTime(data?.updated_at));
  }, [data?.updated_at]);

  const coins = useMemo(() => {
    let list = (data?.coins || []).map((k, i) => ({ ...k, rank: i + 1 }));
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((k) => (k.name || '').toLowerCase().includes(s) || (k.symbol || '').toLowerCase().includes(s));
    }
    if (sort === 'gainers') list = [...list].sort((a, b) => (b.change_24h ?? -999) - (a.change_24h ?? -999));
    if (sort === 'losers') list = [...list].sort((a, b) => (a.change_24h ?? 999) - (b.change_24h ?? 999));
    if (sort === 'price') list = [...list].sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0));
    return list;
  }, [data, q, sort]);

  if (!c) return null;
  const top = data?.coins?.[0];
  const localDec = c.decimals >= 3 ? 3 : 2;

  return (
    <div className="cp" data-country={code}>
      <CountryHero code={code} title={`أسعار العملات الرقمية في ${c.name}`} fx={data?.fx} time={time} />

      {top && (
        <section className="global-ounce-section">
          <div className="ounce-card">
            <div className="ounce-header">
              <span>
                <img
                  className="crypto-card-icon inline-coin"
                  src={top.image || FALLBACK_ICON(top.symbol)}
                  alt={top.symbol}
                  width="24"
                  height="24"
                />
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
            <div className="cp-ounce-local" style={{ marginTop: 6 }}>
              <LivePrice value={top.price_local ?? null} decimals={localDec} suffix={` ${c.short}`} live volatility={0.0002} tickMs={2200} />
            </div>
          </div>
        </section>
      )}

      <div className="crypto-legal-note">
        <FaIcon icon="fa-solid fa-circle-info" />
        <span>
          للأغراض المعلوماتية فقط. الأسعار المعروضة بيانات استرشادية من مصادر عامة، محسوبة بالدولار ثم محوّلة
          إلى {c.currencyName}. التعامل في العملات الرقمية يخضع لقوانين وتنظيمات {c.name} وقد يكون مقيّدًا أو
          محظورًا، فتأكد من الجهة المنظمة المحلية قبل أي تعامل. الصفحة لا تقدّم بيعًا أو شراءً أو وساطة أو
          نصائح استثمارية ولا روابط تحويل لأي منصة.
        </span>
      </div>

      <section>
        <div className="section-title-bar">
          <h2>
            <FaIcon icon="fa-brands fa-bitcoin" /> أعلى 20 عملة رقمية مقابل {c.currencyName}
          </h2>
        </div>

        <div className="crypto-toolbar">
          <div className="crypto-search">
            <FaIcon icon="fa-solid fa-magnifying-glass" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="دور على عملة..."
              aria-label="بحث عن عملة"
            />
          </div>
          <div className="crypto-filters">
            {FILTERS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`crypto-chip${sort === k ? ' active' : ''}`}
                onClick={() => setSort(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && !data && <p className="crypto-list-loading">جاري التحميل...</p>}
        {error && !data && !loading && <p className="error-text">تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.</p>}

        <div className="crypto-list">
          {coins.map((k) => {
            const changeKnown = typeof k.change_24h === 'number';
            const isNeg = changeKnown && k.change_24h < 0;
            return (
              <div key={k.id} className="crypto-row crypto-row-nolink">
                <span className="crypto-card-rank">{k.rank}</span>
                <img
                  className="crypto-card-icon"
                  src={k.image || FALLBACK_ICON(k.symbol)}
                  alt={k.symbol}
                  width="32"
                  height="32"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_ICON(k.symbol);
                  }}
                />
                <div className="crypto-row-info">
                  <span className="crypto-row-name">{k.name}</span>
                  <span className="crypto-row-symbol">{k.symbol}</span>
                </div>
                <div className="crypto-row-prices">
                  <span className="crypto-card-price-usd">
                    <LivePrice value={k.price_usd ?? null} decimals={k.price_usd < 1 ? 4 : 2} prefix="$" live volatility={0.00018} tickMs={2600} />
                  </span>
                  <span className="crypto-card-price-egp">
                    <LivePrice
                      value={k.price_local ?? null}
                      decimals={k.price_local < 1 ? 4 : localDec}
                      suffix={` ${c.short}`}
                      live
                      volatility={0.00018}
                      tickMs={2600}
                    />
                  </span>
                </div>
                {changeKnown && (
                  <span className={`badge-change ${isNeg ? 'negative' : 'positive'}`}>
                    {isNeg ? '▼' : '▲'} {Math.abs(k.change_24h).toFixed(2)}%
                  </span>
                )}
              </div>
            );
          })}
          {data && !coins.length && <p className="crypto-list-loading">مفيش عملة بالاسم ده</p>}
        </div>
      </section>

      <section id="tool-crypto-calc" className="page-tools">
        <div className="section-title-bar">
          <h2>
            <FaIcon icon="fa-solid fa-calculator" /> أدوات العملات الرقمية
          </h2>
        </div>
        <LazyOnView minHeight={330}>
          <CountryCryptoCalc code={code} data={data} />
        </LazyOnView>
      </section>
    </div>
  );
}

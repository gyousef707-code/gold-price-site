import { Link, useParams, Navigate } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import TradingViewChart from '../components/TradingViewChart.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import useApiData from '../hooks/useApiData.js';
import { cryptoDetails } from '../data/crypto.js';
import { CRYPTO_TV_SYMBOL } from '../data/cryptoSymbols.js';

export default function CryptoCoinPage() {
  const { coin } = useParams();
  const info = cryptoDetails.find((c) => c.id === coin);
  const { data } = useApiData('/api/crypto-price', { intervalMs: 60000 });

  if (!info) return <Navigate to="/crypto" replace />;

  const liveCoin = data?.coins?.find((c) => c.id === coin);
  const otherCoins = cryptoDetails.filter((c) => c.id !== coin).slice(0, 5);

  return (
    <div className="page-wrap">
      <Seo title={info.title} description={info.description} path={`/crypto/${coin}`} type="article" />

      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link> / <Link to="/crypto">العملات الرقمية</Link> / {info.h1.split('(')[0]}
      </div>
      <span className="eyebrow">عملات رقمية</span>
      <h1>{info.h1}</h1>

      <div className="crypto-detail-header">
        {liveCoin?.image && <img className="crypto-detail-icon" src={liveCoin.image} alt={liveCoin.symbol} />}
        <div className="crypto-detail-info">
          <h2>{liveCoin?.name || info.h1.split('(')[0]}</h2>
          <span className="crypto-detail-symbol-badge">{liveCoin?.symbol}</span>
        </div>
      </div>

      <div className="crypto-detail-prices">
        <div className="crypto-detail-price-box">
          <span className="crypto-detail-price-label">السعر بالدولار</span>
          <span className="crypto-detail-price-value">${liveCoin ? liveCoin.price_usd.toLocaleString('en-US') : '—'}</span>
        </div>
        <div className="crypto-detail-price-box">
          <span className="crypto-detail-price-label">السعر بالجنيه</span>
          <span className="crypto-detail-price-value">{liveCoin ? liveCoin.price_egp.toLocaleString('en-US') : '—'} ج.م</span>
        </div>
      </div>

      <div className="live-cta">
        <p>احسب قيمة أي كمية من {liveCoin?.name || ''} بسهولة</p>
        <Link to="/tools#tool-crypto-calc" className="btn">احسب القيمة</Link>
      </div>

      <p>{info.intro}</p>

      {info.specRows.length > 0 && (
        <table className="spec-table">
          <tbody>
            {info.specRows.map(([label, value], i) => (
              <tr key={i}><th>{label}</th><td>{value}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {info.beginnerNote && <p>{info.beginnerNote}</p>}

      {CRYPTO_TV_SYMBOL[coin] && <TradingViewChart symbol={CRYPTO_TV_SYMBOL[coin]} id={`tv-${coin}`} />}

      <RelatedArticles slugs={['beginners-guide-gold-investment', 'gold-vs-silver-investment']} count={2} />

      <div className="related-box">
        <h3>عملات رقمية أخرى</h3>
        <ul>
          {otherCoins.map((c) => (
            <li key={c.id}><Link to={`/crypto/${c.id}`}>{c.h1}</Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

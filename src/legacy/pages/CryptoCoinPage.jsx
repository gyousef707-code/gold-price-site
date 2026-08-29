import { Link, useParams, Navigate } from '@/lib/router-compat.jsx';
import Seo from '../components/Seo.jsx';
import TradingViewChart from '../components/TradingViewChart.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import useApiData from '../hooks/useApiData.js';
import { cryptoDetails } from '../data/crypto.js';
import { CRYPTO_TV_SYMBOL, SYMBOL_TO_ID } from '../data/cryptoSymbols.js';

const FALLBACK_ICON = (id) => `https://assets.coincap.io/assets/icons/${id}@2x.png`;

export default function CryptoCoinPage() {
  const { coin } = useParams();
  const info = cryptoDetails.find((c) => c.id === coin);
  const { data, loading } = useApiData('/api/public/crypto-price', { intervalMs: 60000 });

  // العملة اللي عندها محتوى ثابت (info) بنلاقيها في القايمة الحية عن طريق
  // خريطة SYMBOL_TO_ID. أي عملة تانية (معندهاش محتوى ثابت لسه) بندوّر عليها
  // برمزها مباشرة، عشان تفضل قابلة للفتح زي كل العملات.
  const liveCoin = info
    ? (data?.coins || []).find((c) => SYMBOL_TO_ID[c.symbol] === coin)
    : (data?.coins || []).find((c) => (c.symbol || '').toLowerCase() === coin);

  // لسه بيحمّل البيانات ومفيش محتوى ثابت لحد دلوقتي — استنى قبل ما تقرر إن
  // العملة مش موجودة (لو قررنا بدري هنرجّع أي عملة جديدة لصفحة /crypto غلط)
  if (!info && loading) {
    return (
      <div className="page-wrap">
        <p className="crypto-list-loading">جاري التحميل...</p>
      </div>
    );
  }

  // خلص التحميل ومفيش محتوى ثابت ولا لقيناها في القايمة الحية — فعلاً مش موجودة
  if (!info && !liveCoin) return <Navigate to="/crypto" replace />;

  const symbol = liveCoin?.symbol || info?.specRows.find(([label]) => label === 'الرمز')?.[1] || (coin || '').toUpperCase();
  const name = liveCoin?.name || info?.h1.split('(')[0]?.trim() || symbol;
  const tvSymbol = info ? CRYPTO_TV_SYMBOL[coin] : `BINANCE:${symbol}USDT`;
  const otherCoins = cryptoDetails.filter((c) => c.id !== coin).slice(0, 5);

  return (
    <div className="page-wrap">
      <Seo
        title={info?.title || `سعر ${name} (${symbol}) اليوم بالجنيه المصري | ذهبي`}
        description={info?.description || `تابع سعر عملة ${name} (${symbol}) الرقمية لحظة بلحظة بالجنيه المصري والدولار.`}
        path={`/crypto/${coin}`}
        type="article"
      />

      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link> / <Link to="/crypto">العملات الرقمية</Link> / {name}
      </div>
      <span className="eyebrow">عملات رقمية</span>
      <h1>{info?.h1 || `سعر ${name} (${symbol}) اليوم`}</h1>

      <div className="crypto-detail-header">
        <img
          className="crypto-detail-icon"
          src={liveCoin?.image || FALLBACK_ICON(symbol.toLowerCase())}
          alt={symbol}
          width="48"
          height="48"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="crypto-detail-info">
          <h2>{name}</h2>
          <span className="crypto-detail-symbol-badge">{symbol}</span>
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
        <p>احسب قيمة أي كمية من {name} بسهولة</p>
        <Link to={`/crypto?coin=${symbol}#tool-crypto-calc`} className="btn">احسب القيمة</Link>
      </div>

      {info ? (
        <>
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
        </>
      ) : (
        <p>
          {name} ({symbol}) من أكبر 20 عملة رقمية من حيث القيمة السوقية حالياً. السعر المعروض فوق بيتحدّث أول بأول من مصادر السوق العالمية.
          الصفحة دي للأغراض المعلوماتية فقط ومش بتقدّم نصائح استثمارية ولا وساطة أو روابط تحويل لأي منصة.
        </p>
      )}

      {tvSymbol && <TradingViewChart symbol={tvSymbol} id={`tv-${coin}`} />}

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

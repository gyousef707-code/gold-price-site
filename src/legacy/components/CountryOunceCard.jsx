import LivePrice from './LivePrice.jsx';
import MarketStatus from './MarketStatus.jsx';
import UpdatedStamp from './UpdatedStamp.jsx';
import { useLang } from '../context/LangContext.jsx';
import { COUNTRIES, formatMoney } from '../data/countries.js';

// كارت الأونصة العالمية: نفس تصميم صفحة مصر (global-ounce-section)، وتحته سعرها بعملة الدولة
export default function CountryOunceCard({ code, title, ounceUsd, ounceLocal, change, updatedAt, volatility = 0.00012 }) {
  const { t, lang } = useLang();
  const c = COUNTRIES[code];
  if (!c) return null;
  const changePct = change != null ? Number(change) : null;
  return (
    <section className="global-ounce-section">
      <div className="ounce-card">
        <div className="ounce-header">
          <span>{title}</span>
          {changePct != null && (
            <span className={`badge-change ${changePct >= 0 ? 'positive' : 'negative'}`}>
              {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
            </span>
          )}
        </div>
        <div className="ounce-price">
          <LivePrice value={ounceUsd != null ? Number(ounceUsd) : null} prefix="$" decimals={2} live volatility={volatility} tickMs={2400} />
        </div>
        <p className="cp-ounce-local" style={{ margin: '4px 0 2px' }}>
          {ounceLocal != null ? `≈ ${formatMoney(ounceLocal, c.decimals ?? 2)} ${c.short} للأونصة` : '—'}
        </p>
        <UpdatedStamp lang={lang} date={updatedAt} />
        <div className="ounce-footer">
          <span className="live-pulse">
            <span className="update-dot" /> {t('live')}
          </span>
          <MarketStatus lang={lang} />
        </div>
      </div>
    </section>
  );
}

import { useMemo, useState } from 'react';
import useApiData from '../../hooks/useApiData.js';
import NumberInput from '../NumberInput.jsx';
import { useLang } from '../../context/LangContext.jsx';

export default function CryptoCalculator() {
  const { t } = useLang();
  const { data } = useApiData('/api/public/crypto-price', { intervalMs: 60000 });
  const [coinId, setCoinId] = useState('bitcoin');
  const [qty, setQty] = useState(1);
  const [currency, setCurrency] = useState('egp');

  const coins = data?.coins || [];
  const coin = coins.find((c) => c.id === coinId) || coins[0];

  const result = useMemo(() => {
    if (!coin) return null;
    const price = currency === 'egp' ? coin.price_egp : coin.price_usd;
    return price != null ? price * qty : null;
  }, [coin, qty, currency]);

  return (
    <div className="calc-card" id="tool-crypto-calc">
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2><i className="fa-brands fa-bitcoin" /> {t('calc.crypto.title')}</h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>{t('calc.coin')}</label>
          <select className="calc-input calc-select" value={coinId} onChange={(e) => setCoinId(e.target.value)}>
            {coins.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
          </select>
        </div>
        <div className="calc-group">
          <label>{t('calc.qty')}</label>
          <NumberInput value={qty} onChange={setQty} />
        </div>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>{t('calc.currency')}</label>
          <select className="calc-input calc-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="egp">{t('calc.egp')}</option>
            <option value="usd">{t('calc.usd')}</option>
          </select>
        </div>
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">{t('calc.result')}</div>
        <div className="calc-result-value">{result != null ? result.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div className="calc-result-unit">{currency === 'egp' ? t('calc.egp') : t('calc.usd')}</div>
      </div>
    </div>
  );
}

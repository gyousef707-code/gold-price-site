import { useMemo, useState } from 'react';
import useApiData from '../../hooks/useApiData.js';

export default function CryptoCalculator() {
  const { data } = useApiData('/api/crypto-price', { intervalMs: 60000 });
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
    <div className="calc-box" id="tool-crypto-calc">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>حاسبة العملات الرقمية</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>احسب قيمة اي عملة رقمية بالجنيه او الدولار</p>

      <div className="calc-label">العملة الرقمية</div>
      <select className="calc-select" value={coinId} onChange={(e) => setCoinId(e.target.value)}>
        {coins.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
      </select>

      <div className="calc-label">الكمية</div>
      <input className="calc-input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />

      <div className="calc-label">العملة</div>
      <select className="calc-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="egp">جنيه مصري</option>
        <option value="usd">دولار امريكي</option>
      </select>

      <div className="calc-result-box">
        <div className="calc-result-value">{result != null ? result.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currency === 'egp' ? 'جنيه مصري' : 'دولار امريكي'}</div>
      </div>
    </div>
  );
}

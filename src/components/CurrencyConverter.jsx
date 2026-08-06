import { useMemo, useState } from 'react';
import { CURRENCY_META, CURRENCY_ORDER } from '../data/currencies.js';

export default function CurrencyConverter({ rates, initialFrom = 'usd' }) {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState('egp');

  const allCodes = ['egp', ...CURRENCY_ORDER];

  const result = useMemo(() => {
    if (!rates) return null;
    const fromMid = from === 'egp' ? 1 : rates[from]?.mid;
    const toMid = to === 'egp' ? 1 : rates[to]?.mid;
    if (!fromMid || !toMid) return null;
    // كل سعر بيمثل قيمة الوحدة بالجنيه المصري
    const egpValue = amount * fromMid;
    return egpValue / toMid;
  }, [amount, from, to, rates]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="calc-box">
      <div className="calc-label">المبلغ</div>
      <input
        className="calc-input"
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value) || 0)}
      />

      <div className="calc-label">من</div>
      <select className="calc-select" value={from} onChange={(e) => setFrom(e.target.value)}>
        {allCodes.map((c) => (
          <option key={c} value={c}>{CURRENCY_META[c].name}</option>
        ))}
      </select>

      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <button
          type="button"
          className="icon-btn"
          onClick={swap}
          aria-label="عكس العملتين"
          style={{ display: 'inline-flex' }}
        >
          <i className="fa-solid fa-arrow-right-arrow-left" />
        </button>
      </div>

      <div className="calc-label">إلى</div>
      <select className="calc-select" value={to} onChange={(e) => setTo(e.target.value)}>
        {allCodes.map((c) => (
          <option key={c} value={c}>{CURRENCY_META[c].name}</option>
        ))}
      </select>

      <div className="calc-result-box">
        <div className="calc-result-value">
          {result != null ? result.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{CURRENCY_META[to].name}</div>
      </div>
    </div>
  );
}

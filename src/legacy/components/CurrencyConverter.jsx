import { useEffect, useMemo, useState } from 'react';
import { CURRENCY_META, CURRENCY_ORDER } from '../data/currencies.js';
import LivePrice from './LivePrice.jsx';
import NumberInput from './NumberInput.jsx';
import FaIcon from './FaIcon.jsx';

export default function CurrencyConverter({ rates, selected }) {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState('usd');
  const [to, setTo] = useState('egp');
  const allCodes = ['egp', ...CURRENCY_ORDER];

  // لما المستخدم يدوس على أى عملة فى القائمة، تتبدل مكان الدولار أوتوماتيك
  useEffect(() => {
    if (!selected || !CURRENCY_META[selected]) return;
    setFrom(selected);
    setTo((prev) => (prev === selected ? 'egp' : prev));
  }, [selected]);


  const result = useMemo(() => {
    if (!rates) return null;
    const fromMid = from === 'egp' ? 1 : rates[from]?.mid;
    const toMid = to === 'egp' ? 1 : rates[to]?.mid;
    if (!fromMid || !toMid) return null;
    return (amount * fromMid) / toMid;
  }, [amount, from, to, rates]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const flag = (code) => (
    <img
      className="converter-flag-img"
      src={`https://flagcdn.com/24x18/${CURRENCY_META[code].flag}.png`}
      width="24"
      height="18"
      alt={code}
      loading="lazy"
    />
  );

  return (
    <div className="converter-box">
      <span className="converter-label">من</span>
      <div className="converter-row">
        <div className="converter-select-wrapper">
          {flag(from)}
          <span className="converter-code">{from.toUpperCase()}</span>
          <FaIcon icon="fa-solid fa-chevron-down" className="converter-select-arrow" />
          <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="من">
            {allCodes.map((c) => (
              <option key={c} value={c}>{CURRENCY_META[c].name}</option>
            ))}
          </select>
        </div>
        <NumberInput className="converter-input" value={amount} onChange={setAmount} />
      </div>

      <div className="converter-divider">
        <button type="button" className="swap-btn" onClick={swap} aria-label="عكس العملتين">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 3v18" />
            <path d="M4.5 6.5 8 3l3.5 3.5" />
            <path d="M16 21V3" />
            <path d="M12.5 17.5 16 21l3.5-3.5" />
          </svg>
        </button>
      </div>


      <span className="converter-label">إلى</span>
      <div className="converter-row">
        <div className="converter-select-wrapper">
          {flag(to)}
          <span className="converter-code">{to.toUpperCase()}</span>
          <FaIcon icon="fa-solid fa-chevron-down" className="converter-select-arrow" />
          <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="إلى">
            {allCodes.map((c) => (
              <option key={c} value={c}>{CURRENCY_META[c].name}</option>
            ))}
          </select>
        </div>
        <div className="converter-input converter-output">
          <LivePrice value={result} decimals={2} />
        </div>
      </div>

      <div className="converter-note">
        1 {from.toUpperCase()} ={' '}
        {rates
          ? (((from === 'egp' ? 1 : rates[from]?.mid) || 0) / ((to === 'egp' ? 1 : rates[to]?.mid) || 1)).toLocaleString('en-US', { maximumFractionDigits: 4 })
          : '—'}{' '}
        {to.toUpperCase()}
      </div>
    </div>
  );
}

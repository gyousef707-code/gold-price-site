import { useMemo, useState } from 'react';
import useApiData from '../../hooks/useApiData.js';

export default function GoldCalculator() {
  const { data } = useApiData('/api/gold-price', { intervalMs: 60000 });
  const [weight, setWeight] = useState(10);
  const [karat, setKarat] = useState('21');
  const [priceType, setPriceType] = useState('sell');
  const [currency, setCurrency] = useState('egp');

  const result = useMemo(() => {
    const p = data?.caratPrices?.[karat];
    if (!p) return null;
    const perGram = p[priceType];
    const egp = perGram * weight;
    if (currency === 'egp') return egp;
    if (data?.bank_usd_rate) return egp / data.bank_usd_rate;
    return null;
  }, [data, weight, karat, priceType, currency]);

  return (
    <div className="calc-card" id="tool-gold-calc">
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2><i className="fa-solid fa-calculator" /> حاسبة الذهب</h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>الوزن (جرام)</label>
          <input type="number" className="calc-input" value={weight} onChange={(e) => setWeight(Number(e.target.value) || 0)} />
        </div>
        <div className="calc-group">
          <label>العيار</label>
          <select className="calc-input calc-select" value={karat} onChange={(e) => setKarat(e.target.value)}>
            {['24', '22', '21', '18', '14', '12'].map((k) => <option key={k} value={k}>عيار {k}</option>)}
          </select>
        </div>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>نوع السعر</label>
          <select className="calc-input calc-select" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
            <option value="sell">سعر البيع</option>
            <option value="buy">سعر الشراء</option>
          </select>
        </div>
        <div className="calc-group">
          <label>العملة</label>
          <select className="calc-input calc-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="egp">جنيه مصري</option>
            <option value="usd">دولار امريكي</option>
          </select>
        </div>
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">القيمة التقديرية</div>
        <div className="calc-result-value">{result != null ? result.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div className="calc-result-unit">{currency === 'egp' ? 'جنيه مصري' : 'دولار امريكي'}</div>
      </div>
    </div>
  );
}

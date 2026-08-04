import { useMemo, useState } from 'react';
import useApiData from '../../hooks/useApiData.js';

export default function SilverCalculator() {
  const { data } = useApiData('/api/silver-price', { intervalMs: 5 * 60000 });
  const [weight, setWeight] = useState(10);
  const [karat, setKarat] = useState('925');
  const [priceType, setPriceType] = useState('sell');
  const [currency, setCurrency] = useState('egp');

  const result = useMemo(() => {
    const p = data?.silverPrices?.[karat];
    if (!p) return null;
    const perGram = p[priceType];
    const egp = perGram * weight;
    if (currency === 'egp') return egp;
    if (data?.bank_usd_rate) return egp / data.bank_usd_rate;
    return null;
  }, [data, weight, karat, priceType, currency]);

  return (
    <div className="calc-box" id="tool-silver-calc">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>حاسبة الفضة</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>احسب قيمة الفضة حسب الوزن والعيار</p>

      <div className="calc-label">الوزن (جرام)</div>
      <input className="calc-input" type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value) || 0)} />

      <div className="calc-label">العيار</div>
      <select className="calc-select" value={karat} onChange={(e) => setKarat(e.target.value)}>
        {['999', '925', '900', '800', '720', '500'].map((k) => <option key={k} value={k}>عيار {k}</option>)}
      </select>

      <div className="calc-label">نوع السعر</div>
      <select className="calc-select" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
        <option value="sell">سعر البيع</option>
        <option value="buy">سعر الشراء</option>
      </select>

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

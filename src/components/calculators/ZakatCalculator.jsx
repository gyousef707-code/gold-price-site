import { useMemo, useState } from 'react';
import useApiData from '../../hooks/useApiData.js';

export default function ZakatCalculator() {
  const { data } = useApiData('/api/gold-price', { intervalMs: 60000 });
  const [weight, setWeight] = useState(85);
  const [karat, setKarat] = useState('21');
  const [priceType, setPriceType] = useState('sell');

  const result = useMemo(() => {
    const p = data?.caratPrices?.[karat];
    if (!p) return null;
    const totalValue = p[priceType] * weight;
    return totalValue * 0.025;
  }, [data, weight, karat, priceType]);

  return (
    <div className="calc-box" id="tool-zakat-calc">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>حاسبة زكاة الذهب</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>احسب زكاة الذهب (2.5%)</p>

      <div className="calc-label">الوزن المستحق زكاته (جرام)</div>
      <input className="calc-input" type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value) || 0)} />

      <div className="calc-label">العيار</div>
      <select className="calc-select" value={karat} onChange={(e) => setKarat(e.target.value)}>
        {['24', '22', '21', '18', '14', '12'].map((k) => <option key={k} value={k}>عيار {k}</option>)}
      </select>

      <div className="calc-label">نوع السعر</div>
      <select className="calc-select" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
        <option value="sell">سعر البيع</option>
        <option value="buy">سعر الشراء</option>
      </select>

      <div className="calc-result-box">
        <div className="calc-result-value">{result != null ? result.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>جنيه مصري (قيمة الزكاة)</div>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>
        نصاب الزكاة الشرعي التقريبي 85 جرام ذهب عيار 21. استشر جهة دينية موثوقة لتفاصيل حالتك.
      </p>
    </div>
  );
}

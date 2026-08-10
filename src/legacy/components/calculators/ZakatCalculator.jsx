import { useMemo, useState } from 'react';
import useApiData from '../../hooks/useApiData.js';
import NumberInput from '../NumberInput.jsx';

export default function ZakatCalculator() {
  const { data } = useApiData('/api/public/gold-price', { intervalMs: 60000 });
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
    <div className="calc-card" id="tool-zakat-calc">
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2><i className="fa-solid fa-hand-holding-dollar" /> حاسبة زكاة الذهب</h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>الوزن المستحق زكاته (جرام)</label>
          <NumberInput value={weight} onChange={setWeight} />
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
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">قيمة الزكاة</div>
        <div className="calc-result-value">{result != null ? result.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div className="calc-result-unit">جنيه مصري (2.5%)</div>
      </div>
    </div>
  );
}

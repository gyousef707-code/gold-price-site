import { useMemo, useState } from 'react';
import useApiData from '../../hooks/useApiData.js';

const CONFIG = {
  gold: {
    id: 'tool-gold-savings',
    title: 'ادخار الذهب',
    subtitle: 'خطط لادخارك بالذهب',
    endpoint: '/api/gold-price',
    intervalMs: 60000,
    karats: ['24', '22', '21', '18'],
    priceMap: (data, karat) => data?.caratPrices?.[karat],
    unitLabel: 'الوزن التقديري من الذهب',
  },
  silver: {
    id: 'tool-silver-savings',
    title: 'ادخار الفضة',
    subtitle: 'خطط لادخارك بالفضة',
    endpoint: '/api/silver-price',
    intervalMs: 5 * 60000,
    karats: ['999', '925', '900', '800'],
    priceMap: (data, karat) => data?.silverPrices?.[karat],
    unitLabel: 'الوزن التقديري من الفضة',
  },
};

export default function SavingsCalculator({ metal }) {
  const cfg = CONFIG[metal];
  const { data } = useApiData(cfg.endpoint, { intervalMs: cfg.intervalMs });
  const [monthly, setMonthly] = useState(1000);
  const [months, setMonths] = useState(60);
  const [karat, setKarat] = useState(cfg.karats[metal === 'gold' ? 2 : 1]);
  const [priceType, setPriceType] = useState('sell');

  const total = monthly * months;

  const weight = useMemo(() => {
    const p = cfg.priceMap(data, karat);
    if (!p) return null;
    return total / p[priceType];
  }, [data, karat, priceType, total, cfg]);

  return (
    <div className="calc-box" id={cfg.id}>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{cfg.title}</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>{cfg.subtitle}</p>

      <div className="calc-label">المبلغ الشهري (جنيه)</div>
      <input className="calc-input" type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value) || 0)} />

      <div className="calc-label">المدة (شهر)</div>
      <input className="calc-input" type="number" value={months} onChange={(e) => setMonths(Number(e.target.value) || 0)} />

      <div className="calc-label">العيار</div>
      <select className="calc-select" value={karat} onChange={(e) => setKarat(e.target.value)}>
        {cfg.karats.map((k) => <option key={k} value={k}>عيار {k}</option>)}
      </select>

      <div className="calc-label">نوع السعر</div>
      <select className="calc-select" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
        <option value="sell">سعر البيع</option>
        <option value="buy">سعر الشراء</option>
      </select>

      <div className="calc-result-box">
        <div className="calc-result-value">{total.toLocaleString('en-US')}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>جنيه مصري (اجمالي المبلغ المدخر)</div>
      </div>
      <div className="calc-result-box" style={{ marginTop: 8 }}>
        <div className="calc-result-value">{weight != null ? weight.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>جرام ({cfg.unitLabel})</div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import useApiData from '../../hooks/useApiData.js';

const CONFIG = {
  gold: {
    id: 'tool-gold-savings',
    title: 'ادخار الذهب',
    icon: 'fa-solid fa-piggy-bank',
    endpoint: '/api/gold-price',
    intervalMs: 60000,
    karats: ['24', '22', '21', '18'],
    priceMap: (data, karat) => data?.caratPrices?.[karat],
    unitLabel: 'الوزن التقديري من الذهب',
  },
  silver: {
    id: 'tool-silver-savings',
    title: 'ادخار الفضة',
    icon: 'fa-solid fa-coins',
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
    <div className="calc-card" id={cfg.id}>
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2><i className={cfg.icon} /> {cfg.title}</h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>المبلغ الشهري (جنيه)</label>
          <input type="number" className="calc-input" value={monthly} onChange={(e) => setMonthly(Number(e.target.value) || 0)} />
        </div>
        <div className="calc-group">
          <label>المدة (شهر)</label>
          <input type="number" className="calc-input" value={months} onChange={(e) => setMonths(Number(e.target.value) || 0)} />
        </div>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>العيار</label>
          <select className="calc-input calc-select" value={karat} onChange={(e) => setKarat(e.target.value)}>
            {cfg.karats.map((k) => <option key={k} value={k}>عيار {k}</option>)}
          </select>
        </div>
        <div className="calc-group">
          <label>نوع السعر</label>
          <select className="calc-input calc-select" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
            <option value="sell">سعر البيع</option>
            <option value="buy">سعر الشراء</option>
          </select>
        </div>
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">اجمالي المبلغ المدخر</div>
        <div className="calc-result-value">{total.toLocaleString('en-US')}</div>
        <div className="calc-result-unit">جنيه مصري</div>
      </div>
      <div className="calc-result-box" style={{ marginTop: 8 }}>
        <div className="calc-result-label">{cfg.unitLabel}</div>
        <div className="calc-result-value">{weight != null ? weight.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div className="calc-result-unit">جرام</div>
      </div>
    </div>
  );
}

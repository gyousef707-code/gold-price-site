import { useMemo, useState } from 'react';
import useApiData from '../../hooks/useApiData.js';
import NumberInput from '../NumberInput.jsx';
import { useLang } from '../../context/LangContext.jsx';

const CONFIG = {
  gold: {
    id: 'tool-gold-savings',
    titleKey: 'calc.savings.gold',
    icon: 'fa-solid fa-piggy-bank',
    endpoint: '/api/public/gold-price',
    intervalMs: 60000,
    karats: ['24', '22', '21', '18'],
    priceMap: (data, karat) => data?.caratPrices?.[karat],
    unitLabelKey: 'calc.weightGold',
  },
  silver: {
    id: 'tool-silver-savings',
    titleKey: 'calc.savings.silver',
    icon: 'fa-solid fa-coins',
    endpoint: '/api/public/silver-price',
    intervalMs: 5 * 60000,
    karats: ['999', '925', '900', '800'],
    priceMap: (data, karat) => data?.silverPrices?.[karat],
    unitLabelKey: 'calc.weightSilver',
  },
};

export default function SavingsCalculator({ metal }) {
  const { t } = useLang();
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
        <h2><i className={cfg.icon} /> {t(cfg.titleKey)}</h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>{t('calc.monthly')}</label>
          <NumberInput value={monthly} onChange={setMonthly} />
        </div>
        <div className="calc-group">
          <label>{t('calc.months')}</label>
          <NumberInput value={months} onChange={setMonths} />
        </div>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>{t('calc.karat')}</label>
          <select className="calc-input calc-select" value={karat} onChange={(e) => setKarat(e.target.value)}>
            {cfg.karats.map((k) => <option key={k} value={k}>{t('calc.karatOption')} {k}</option>)}
          </select>
        </div>
        <div className="calc-group">
          <label>{t('calc.priceType')}</label>
          <select className="calc-input calc-select" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
            <option value="sell">{t('calc.sellPrice')}</option>
            <option value="buy">{t('calc.buyPrice')}</option>
          </select>
        </div>
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">{t('calc.savedTotal')}</div>
        <div className="calc-result-value">{total.toLocaleString('en-US')}</div>
        <div className="calc-result-unit">{t('calc.egp')}</div>
      </div>
      <div className="calc-result-box" style={{ marginTop: 8 }}>
        <div className="calc-result-label">{t(cfg.unitLabelKey)}</div>
        <div className="calc-result-value">{weight != null ? weight.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div className="calc-result-unit">{t('calc.gram')}</div>
      </div>
    </div>
  );
}

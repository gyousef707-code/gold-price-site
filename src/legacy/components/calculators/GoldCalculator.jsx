import { useMemo, useState } from 'react';
import FaIcon from '../FaIcon.jsx';
import useApiData from '../../hooks/useApiData.js';
import NumberInput from '../NumberInput.jsx';
import { useLang } from '../../context/LangContext.jsx';

export default function GoldCalculator() {
  const { t } = useLang();
  const { data } = useApiData('/api/public/gold-price', { intervalMs: 60000 });
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
        <h2><FaIcon icon="fa-solid fa-calculator" /> {t('calc.gold.title')}</h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>{t('calc.weight')}</label>
          <NumberInput value={weight} onChange={setWeight} className="calc-input calc-input-num" />
        </div>
        <div className="calc-group">
          <label>{t('calc.karat')}</label>
          <select className="calc-input calc-select" value={karat} onChange={(e) => setKarat(e.target.value)}>
            {['24', '22', '21', '18', '14', '12'].map((k) => <option key={k} value={k}>{t('calc.karatOption')} {k}</option>)}
          </select>
        </div>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>{t('calc.priceType')}</label>
          <select className="calc-input calc-select" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
            <option value="sell">{t('calc.sellPrice')}</option>
            <option value="buy">{t('calc.buyPrice')}</option>
          </select>
        </div>
        <div className="calc-group">
          <label>{t('calc.currency')}</label>
          <select className="calc-input calc-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="egp">{t('calc.egp')}</option>
            <option value="usd">{t('calc.usd')}</option>
          </select>
        </div>
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">{t('calc.result')}</div>
        <div className="calc-result-value">{result != null ? result.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div className="calc-result-unit">{currency === 'egp' ? t('calc.egp') : t('calc.usd')}</div>
      </div>
    </div>
  );
}

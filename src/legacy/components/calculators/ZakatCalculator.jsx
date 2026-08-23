import { useMemo, useState } from 'react';
import FaIcon from '../FaIcon.jsx';
import useApiData from '../../hooks/useApiData.js';
import NumberInput from '../NumberInput.jsx';
import { useLang } from '../../context/LangContext.jsx';

export default function ZakatCalculator() {
  const { t } = useLang();
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
        <h2><FaIcon icon="fa-solid fa-hand-holding-dollar" /> {t('calc.zakat.title')}</h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>{t('calc.zakatWeight')}</label>
          <NumberInput value={weight} onChange={setWeight} />
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
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">{t('calc.zakatResult')}</div>
        <div className="calc-result-value">{result != null ? result.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</div>
        <div className="calc-result-unit">{t('calc.zakatUnit')}</div>
      </div>
    </div>
  );
}

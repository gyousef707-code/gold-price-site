import { useMemo, useState } from 'react';
import FaIcon from '../FaIcon.jsx';
import useApiData from '../../hooks/useApiData.js';
import NumberInput from '../NumberInput.jsx';
import { useLang } from '../../context/LangContext.jsx';

// حاسبة الادخار: مبلغ شهري × عدد شهور = إجمالي المدخر، ومنه الوزن التقديري بسعر اليوم.
// metal = 'gold' بيستخدم أسعار الذهب (24..12)، و metal = 'silver' بيستخدم أسعار الفضة (999..500).
export default function SavingsCalculator({ metal = 'gold' }) {
  const { t, lang } = useLang();
  const isGold = metal !== 'silver';
  const { data } = useApiData(isGold ? '/api/public/gold-price' : '/api/public/silver-price', {
    intervalMs: isGold ? 60000 : 5 * 60000,
  });
  const [monthly, setMonthly] = useState(1000);
  const [months, setMonths] = useState(12);
  const [karat, setKarat] = useState(isGold ? '21' : '925');

  const karats = isGold ? ['24', '22', '21', '18', '14', '12'] : ['999', '925', '900', '800', '720', '500'];

  const { total, grams } = useMemo(() => {
    const total = (Number(monthly) || 0) * (Number(months) || 0);
    const prices = isGold ? data?.caratPrices : data?.silverPrices;
    const perGram = prices?.[karat]?.sell;
    return { total, grams: perGram ? total / perGram : null };
  }, [data, monthly, months, karat, isGold]);

  const fmt = (n, d = 2) => n.toLocaleString('en-US', { maximumFractionDigits: d });

  return (
    <div className="calc-card" id={`tool-savings-${isGold ? 'gold' : 'silver'}-card`}>
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2>
          <FaIcon icon={isGold ? 'fa-solid fa-calculator' : 'fa-solid fa-gem'} />{' '}
          {isGold ? t('calc.savings.gold') : t('calc.savings.silver')}
        </h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>{t('calc.monthly')}</label>
          <NumberInput value={monthly} onChange={setMonthly} className="calc-input calc-input-num" />
        </div>
        <div className="calc-group">
          <label>{t('calc.months')}</label>
          <NumberInput value={months} onChange={setMonths} className="calc-input calc-input-num" />
        </div>
      </div>
      <div className="calc-row">
        <div className="calc-group" style={{ flex: 1 }}>
          <label>{t('calc.karat')}</label>
          <select className="calc-input calc-select" value={karat} onChange={(e) => setKarat(e.target.value)}>
            {karats.map((k) => (
              <option key={k} value={k}>
                {t('calc.karatOption')} {k}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">{t('calc.savedTotal')}</div>
        <div className="calc-result-value">{fmt(total, 0)}</div>
        <div className="calc-result-unit">{t('calc.egp')}</div>
      </div>
      <div className="calc-result-box" style={{ marginTop: 10 }}>
        <div className="calc-result-label">{isGold ? t('calc.weightGold') : t('calc.weightSilver')}</div>
        <div className="calc-result-value">{grams != null ? fmt(grams) : '—'}</div>
        <div className="calc-result-unit">{t('calc.gram')}</div>
      </div>
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
        {lang === 'en'
          ? 'Estimated at today\u2019s selling price. Actual weight depends on the price when you buy.'
          : 'تقدير بسعر البيع النهارده، والوزن الفعلي بيتغير حسب سعر يوم الشراء.'}
      </p>
    </div>
  );
}

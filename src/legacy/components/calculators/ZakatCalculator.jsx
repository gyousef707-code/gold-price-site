import { useMemo, useState } from 'react';
import FaIcon from '../FaIcon.jsx';
import useApiData from '../../hooks/useApiData.js';
import NumberInput from '../NumberInput.jsx';
import { useLang } from '../../context/LangContext.jsx';

const KARATS = ['24', '22', '21', '18', '14', '12'];
const NISAB_GRAMS = 85;

export default function ZakatCalculator() {
  const { t, lang } = useLang();
  const en = lang === 'en';
  const { data } = useApiData('/api/public/gold-price', { intervalMs: 60000 });
  const [weight, setWeight] = useState(85);
  // زكاة الذهب بتتقاس على عيار 24 (الذهب الخالص)، فهو المختار افتراضيًا،
  // وبرضه ينفع المستخدم يدوس على أي كارت عيار تاني ويحسب بيه.
  const [karat, setKarat] = useState('24');
  const [priceType, setPriceType] = useState('sell');

  const gramPrice = data?.caratPrices?.[karat]?.[priceType] ?? null;
  const w = Number(weight) || 0;
  const belowNisab = w > 0 && w < NISAB_GRAMS;

  const totalValue = useMemo(() => (gramPrice ? gramPrice * w : null), [gramPrice, w]);
  const zakat = belowNisab || totalValue == null ? null : totalValue * 0.025;

  const fmt = (n) => (n == null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: 2 }));

  return (
    <div className="calc-card zakat-card" id="tool-zakat-calc">
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2><FaIcon icon="fa-solid fa-hand-holding-dollar" /> {t('calc.zakat.title')}</h2>
      </div>

      <p className="zakat-hint">
        {en
          ? 'Gold zakat is measured on 24K (pure gold). You can pick another karat if your gold is different.'
          : 'زكاة الذهب بتتقاس على عيار 24 (الذهب الخالص)، وتقدر تختار عيار تاني لو ذهبك مختلف.'}
      </p>

      <div className="zakat-karat-cards" role="group" aria-label={t('calc.karat')}>
        {KARATS.map((k) => (
          <button
            key={k}
            type="button"
            className={`zakat-karat-card${k === karat ? ' active' : ''}`}
            aria-pressed={k === karat}
            onClick={() => setKarat(k)}
          >
            <span className="zk-label">{t('calc.karatOption')}</span>
            <span className="zk-num">{k}</span>
          </button>
        ))}
      </div>

      <div className="calc-row">
        <div className="calc-group">
          <label>{t('calc.zakatWeight')}</label>
          <NumberInput value={weight} onChange={setWeight} />
        </div>
        <div className="calc-group">
          <label>{t('calc.priceType')}</label>
          <select className="calc-input calc-select" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
            <option value="sell">{t('calc.sellPrice')}</option>
            <option value="buy">{t('calc.buyPrice')}</option>
          </select>
        </div>
      </div>

      <div className="zakat-summary">
        <div className="zakat-summary-row">
          <span>{en ? `Gram price (${karat}K)` : `سعر الجرام (عيار ${karat})`}</span>
          <strong>{fmt(gramPrice)} {en ? 'EGP' : 'ج.م'}</strong>
        </div>
        <div className="zakat-summary-row">
          <span>{en ? 'Total gold value' : 'إجمالي قيمة الذهب'}</span>
          <strong>{fmt(totalValue)} {en ? 'EGP' : 'ج.م'}</strong>
        </div>
        <div className="zakat-summary-row">
          <span>{en ? 'Nisab (85 g)' : 'النصاب (85 جرام)'}</span>
          <strong className={belowNisab ? 'zk-bad' : 'zk-good'}>
            {w <= 0
              ? '—'
              : belowNisab
                ? (en ? `Below by ${fmt(NISAB_GRAMS - w)} g` : `ناقص ${fmt(NISAB_GRAMS - w)} جرام`)
                : (en ? 'Reached' : 'مكتمل')}
          </strong>
        </div>
      </div>

      {belowNisab ? (
        <div className="calc-result-box zakat-result-no">
          <div className="calc-result-label">{t('calc.zakatResult')}</div>
          <div className="calc-result-value" style={{ fontSize: '1.02rem', lineHeight: 1.6 }}>
            {t('calc.zakatNoNisab')}
          </div>
          <div className="calc-result-unit">{t('calc.zakatNisabHint')}</div>
        </div>
      ) : (
        <div className="calc-result-box">
          <div className="calc-result-label">{t('calc.zakatResult')}</div>
          <div className="calc-result-value">{fmt(zakat)}</div>
          <div className="calc-result-unit">{t('calc.zakatUnit')}</div>
        </div>
      )}
    </div>
  );
}

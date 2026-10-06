import { useMemo, useState } from 'react';
import FaIcon from './FaIcon.jsx';
import NumberInput from './NumberInput.jsx';
import { COUNTRIES } from '../data/countries.js';

// حاسبات الدولة: نفس شكل ومنطق حاسبات مصر بالظبط، لكن بعملة الدولة وأسعارها.
// السعر بيتحسب من الأونصة المحلية (data.ounce_local) × نقاء العيار ÷ جرامات الأونصة.

const GRAMS_PER_OUNCE = 31.1034768;
const GOLD_KARATS = ['24', '22', '21', '18', '14', '12'];
const GOLD_PURITY = { 24: 0.999, 22: 0.916, 21: 0.875, 18: 0.75, 14: 0.583, 12: 0.5 };
const SILVER_PURITIES = ['999', '925', '900', '800', '720', '500'];
// نصاب زكاة الذهب: 85 جرام ذهب خالص، وللعيار الأقل بنزوّد الوزن بنفس نسبة النقاء
const PURE_NISAB_GRAMS = 85;
const nisabForKarat = (k) => PURE_NISAB_GRAMS * (GOLD_PURITY[24] / GOLD_PURITY[k]);

const fmt = (n, max = 2) =>
  n == null || !Number.isFinite(n) ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: max });

const goldGram = (data, k) => (data?.ounce_local ? (data.ounce_local / GRAMS_PER_OUNCE) * GOLD_PURITY[k] : null);
const silverGram = (data, p) =>
  data?.silver?.ounce_local ? (data.silver.ounce_local / GRAMS_PER_OUNCE) * (Number(p) / 1000) : null;

function CurrencySelect({ value, onChange, c }) {
  return (
    <select className="calc-input calc-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="local">{c.currencyName}</option>
      <option value="usd">دولار أمريكي</option>
    </select>
  );
}

// تحويل من عملة الدولة للدولار (لو المستخدم اختار الدولار)
const toCurrency = (local, currency, data) => {
  if (local == null) return null;
  if (currency === 'local') return local;
  return data?.fx ? local / data.fx : null;
};

export function CountryGoldCalc({ code, data }) {
  const c = COUNTRIES[code];
  const [weight, setWeight] = useState(10);
  const [karat, setKarat] = useState('21');
  const [currency, setCurrency] = useState('local');
  const [making, setMaking] = useState(0);

  const result = useMemo(() => {
    const g = goldGram(data, karat);
    if (g == null) return null;
    return toCurrency((g + (Number(making) || 0)) * (Number(weight) || 0), currency, data);
  }, [data, weight, karat, currency, making]);

  if (!c) return null;
  return (
    <div className="calc-card" id="tool-gold-calc">
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2>
          <FaIcon icon="fa-solid fa-calculator" /> حاسبة الذهب
        </h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>الوزن (جرام)</label>
          <NumberInput value={weight} onChange={setWeight} className="calc-input calc-input-num" />
        </div>
        <div className="calc-group">
          <label>العيار</label>
          <select className="calc-input calc-select" value={karat} onChange={(e) => setKarat(e.target.value)}>
            {GOLD_KARATS.map((k) => (
              <option key={k} value={k}>
                عيار {k}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>العملة</label>
          <CurrencySelect value={currency} onChange={setCurrency} c={c} />
        </div>
        <div className="calc-group">
          <label>المصنعية ({c.short} للجرام)</label>
          <NumberInput value={making} onChange={setMaking} className="calc-input calc-input-num" />
        </div>
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">القيمة التقديرية</div>
        <div className="calc-result-value">{fmt(result)}</div>
        <div className="calc-result-unit">{currency === 'local' ? c.currencyName : 'دولار أمريكي'}</div>
      </div>
    </div>
  );
}

export function CountrySilverCalc({ code, data }) {
  const c = COUNTRIES[code];
  const [weight, setWeight] = useState(10);
  const [purity, setPurity] = useState('925');
  const [currency, setCurrency] = useState('local');
  const [making, setMaking] = useState(0);

  const result = useMemo(() => {
    const g = silverGram(data, purity);
    if (g == null) return null;
    return toCurrency((g + (Number(making) || 0)) * (Number(weight) || 0), currency, data);
  }, [data, weight, purity, currency, making]);

  if (!c) return null;
  return (
    <div className="calc-card" id="tool-silver-calc">
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2>
          <FaIcon icon="fa-solid fa-gem" /> حاسبة الفضة
        </h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>الوزن (جرام)</label>
          <NumberInput value={weight} onChange={setWeight} className="calc-input calc-input-num" />
        </div>
        <div className="calc-group">
          <label>العيار</label>
          <select className="calc-input calc-select" value={purity} onChange={(e) => setPurity(e.target.value)}>
            {SILVER_PURITIES.map((p) => (
              <option key={p} value={p}>
                عيار {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>العملة</label>
          <CurrencySelect value={currency} onChange={setCurrency} c={c} />
        </div>
        <div className="calc-group">
          <label>المصنعية ({c.short} للجرام)</label>
          <NumberInput value={making} onChange={setMaking} className="calc-input calc-input-num" />
        </div>
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">القيمة التقديرية</div>
        <div className="calc-result-value">{fmt(result)}</div>
        <div className="calc-result-unit">{currency === 'local' ? c.currencyName : 'دولار أمريكي'}</div>
      </div>
    </div>
  );
}

export function CountryZakatCalc({ code, data }) {
  const c = COUNTRIES[code];
  const [weight, setWeight] = useState(85);
  // زكاة الذهب بتتقاس على عيار 24 (الذهب الخالص)، وينفع تختار عيار تاني
  const [karat, setKarat] = useState('24');

  const gramPrice = goldGram(data, karat);
  const w = Number(weight) || 0;
  const nisabGrams = useMemo(() => nisabForKarat(karat), [karat]);
  const belowNisab = w > 0 && w < nisabGrams;
  const totalValue = gramPrice ? gramPrice * w : null;
  const zakat = belowNisab || totalValue == null ? null : totalValue * 0.025;

  if (!c) return null;
  const unit = c.short;
  return (
    <div className="calc-card zakat-card" id="tool-zakat-calc">
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2>
          <FaIcon icon="fa-solid fa-hand-holding-dollar" /> حاسبة زكاة الذهب
        </h2>
      </div>

      <p className="zakat-hint">
        زكاة الذهب بتتقاس على عيار 24 (الذهب الخالص)، وتقدر تختار عيار تاني لو ذهبك مختلف.
      </p>

      <div className="zakat-karat-cards" role="group" aria-label="العيار">
        {GOLD_KARATS.map((k) => (
          <button
            key={k}
            type="button"
            className={`zakat-karat-card${k === karat ? ' active' : ''}`}
            aria-pressed={k === karat}
            onClick={() => setKarat(k)}
          >
            <span className="zk-label">عيار</span>
            <span className="zk-num">{k}</span>
          </button>
        ))}
      </div>

      <div className="calc-row">
        <div className="calc-group" style={{ flex: 1 }}>
          <label>الوزن المستحق زكاته (جرام)</label>
          <NumberInput value={weight} onChange={setWeight} />
        </div>
      </div>

      <div className="zakat-summary">
        <div className="zakat-summary-row">
          <span>سعر الجرام (عيار {karat})</span>
          <strong>
            {fmt(gramPrice)} {unit}
          </strong>
        </div>
        <div className="zakat-summary-row">
          <span>إجمالي قيمة الذهب</span>
          <strong>
            {fmt(totalValue)} {unit}
          </strong>
        </div>
        <div className="zakat-summary-row">
          <span>النصاب ({fmt(nisabGrams)} جرام)</span>
          <strong className={belowNisab ? 'zk-bad' : 'zk-good'}>
            {w <= 0 ? '—' : belowNisab ? `ناقص ${fmt(nisabGrams - w)} جرام` : 'مكتمل'}
          </strong>
        </div>
      </div>

      {belowNisab ? (
        <div className="calc-result-box zakat-result-no">
          <div className="calc-result-label">قيمة الزكاة</div>
          <div className="calc-result-value" style={{ fontSize: '1.02rem', lineHeight: 1.6 }}>
            الوزن أقل من النصاب — مالهوش نصيب في دفع الزكاة ({fmt(nisabGrams)} جرام)
          </div>
          <div className="calc-result-unit">
            نصاب زكاة الذهب 85 جرام من الذهب الخالص (عيار 24). لو ذهبك عيار أقل، الوزن المطلوب للنصاب
            بيزيد بنفس نسبة النقاء.
          </div>
        </div>
      ) : (
        <div className="calc-result-box">
          <div className="calc-result-label">قيمة الزكاة</div>
          <div className="calc-result-value">{fmt(zakat)}</div>
          <div className="calc-result-unit">{c.currencyName} (2.5%)</div>
        </div>
      )}
      <p className="cp-note" style={{ marginTop: 10 }}>
        تجب الزكاة بعد مرور سنة هجرية كاملة على بلوغ النصاب. الحساب استرشادي ولا يغني عن استشارة أهل العلم.
      </p>
    </div>
  );
}

// حاسبة العملات الرقمية (بياناتها من صفحة العملات الرقمية للدولة)
export function CountryCryptoCalc({ code, data }) {
  const c = COUNTRIES[code];
  const [symbol, setSymbol] = useState('BTC');
  const [qty, setQty] = useState(1);
  const [currency, setCurrency] = useState('local');

  const coins = data?.coins || [];
  const coin = coins.find((k) => k.symbol === symbol) || coins[0];
  const result = useMemo(() => {
    if (!coin) return null;
    const price = currency === 'local' ? coin.price_local : coin.price_usd;
    return price != null ? price * (Number(qty) || 0) : null;
  }, [coin, qty, currency]);

  if (!c) return null;
  return (
    <div className="calc-card">
      <div className="section-title-bar" style={{ marginBottom: 12 }}>
        <h2>
          <FaIcon icon="fa-brands fa-bitcoin" /> حاسبة العملات الرقمية
        </h2>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>العملة الرقمية</label>
          <select
            className="calc-input calc-select"
            value={coin?.symbol || symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {coins.map((k) => (
              <option key={k.id} value={k.symbol}>
                {k.name} ({k.symbol})
              </option>
            ))}
          </select>
        </div>
        <div className="calc-group">
          <label>الكمية</label>
          <NumberInput value={qty} onChange={setQty} />
        </div>
      </div>
      <div className="calc-row">
        <div className="calc-group">
          <label>العملة</label>
          <CurrencySelect value={currency} onChange={setCurrency} c={c} />
        </div>
      </div>
      <div className="calc-result-box">
        <div className="calc-result-label">القيمة التقديرية</div>
        <div className="calc-result-value">{fmt(result)}</div>
        <div className="calc-result-unit">{currency === 'local' ? c.currencyName : 'دولار أمريكي'}</div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import useApiData from '../hooks/useApiData.js';
import NumberInput from '../components/NumberInput.jsx';
import CountryHero from '../components/CountryHero.jsx';
import { Link } from '@/lib/router-compat.jsx';
import { COUNTRIES, GOLD_KARATS, SILVER_PURITIES, formatMoney } from '../data/countries.js';

const NISAB_GRAMS = 85; // نصاب زكاة الذهب: 85 جرام ذهب خالص
const KARAT_PURITY = { 24: 0.999, 22: 0.916, 21: 0.875, 18: 0.75 };

export default function CountryToolsPage({ code, initialData = null }) {
  const c = COUNTRIES[code];
  const { data } = useApiData(`/api/public/country-prices?c=${code}&t=gold`, {
    intervalMs: 60000,
    initialData,
  });

  // حاسبة الذهب
  const [gWeight, setGWeight] = useState(10);
  const [gKarat, setGKarat] = useState('21');
  const [gMaking, setGMaking] = useState(0);
  // حاسبة الفضة
  const [sWeight, setSWeight] = useState(100);
  const [sPurity, setSPurity] = useState('999');
  // حاسبة الزكاة
  const [zWeight, setZWeight] = useState(100);
  const [zKarat, setZKarat] = useState('21');

  const dec = c?.decimals ?? 2;
  const money = (v) => (v == null ? '—' : formatMoney(v, dec));
  const karatGram = (k) => data?.karats?.find((x) => x.karat === Number(k))?.gram;
  const silverGram = (p) => data?.silver?.grams?.find((x) => x.purity === Number(p))?.gram;

  const goldTotal = useMemo(() => {
    const g = karatGram(gKarat);
    return g == null ? null : (g + (Number(gMaking) || 0)) * (Number(gWeight) || 0);
  }, [data, gKarat, gWeight, gMaking]); // eslint-disable-line react-hooks/exhaustive-deps

  const silverTotal = useMemo(() => {
    const g = silverGram(sPurity);
    return g == null ? null : g * (Number(sWeight) || 0);
  }, [data, sPurity, sWeight]); // eslint-disable-line react-hooks/exhaustive-deps

  const zakat = useMemo(() => {
    const g = karatGram(zKarat);
    const pure = (Number(zWeight) || 0) * (KARAT_PURITY[zKarat] || 0);
    if (g == null) return null;
    const value = (Number(zWeight) || 0) * g;
    const due = pure >= NISAB_GRAMS;
    return { value, pure, due, amount: due ? value * 0.025 : 0 };
  }, [data, zKarat, zWeight]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!c) return null;

  return (
    <div className="cp" data-country={code}>
      <CountryHero
        code={code}
        title={`حاسبات الذهب والفضة في ${c.name}`}
        subtitle={`كل الحسابات بـ${c.currencyName}`}
        fx={data?.fx}
        live={false}
      />

      <section className="cp-section" aria-labelledby="cpt-gold">
        <h2 id="cpt-gold" className="cp-h">
          حاسبة الذهب
        </h2>
        <div className="calc-card">
          <div className="calc-row">
            <div className="calc-group">
              <label>الوزن (جرام)</label>
              <NumberInput value={gWeight} onChange={setGWeight} className="calc-input calc-input-num" />
            </div>
            <div className="calc-group">
              <label>العيار</label>
              <select className="calc-input calc-select" value={gKarat} onChange={(e) => setGKarat(e.target.value)}>
                {GOLD_KARATS.map((k) => (
                  <option key={k} value={k}>
                    عيار {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="calc-row">
            <div className="calc-group" style={{ flex: 1 }}>
              <label>المصنعية لكل جرام ({c.short})</label>
              <NumberInput value={gMaking} onChange={setGMaking} className="calc-input calc-input-num" />
            </div>
          </div>
          <div className="calc-result-box">
            <div className="calc-result-label">القيمة التقديرية</div>
            <div className="calc-result-value">{money(goldTotal)}</div>
            <div className="calc-result-unit">{c.currencyName}</div>
          </div>
        </div>
      </section>

      <section className="cp-section" aria-labelledby="cpt-silver">
        <h2 id="cpt-silver" className="cp-h">
          حاسبة الفضة
        </h2>
        <div className="calc-card">
          <div className="calc-row">
            <div className="calc-group">
              <label>الوزن (جرام)</label>
              <NumberInput value={sWeight} onChange={setSWeight} className="calc-input calc-input-num" />
            </div>
            <div className="calc-group">
              <label>العيار</label>
              <select className="calc-input calc-select" value={sPurity} onChange={(e) => setSPurity(e.target.value)}>
                {SILVER_PURITIES.map((p) => (
                  <option key={p} value={p}>
                    فضة {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="calc-result-box">
            <div className="calc-result-label">القيمة التقديرية</div>
            <div className="calc-result-value">{money(silverTotal)}</div>
            <div className="calc-result-unit">{c.currencyName}</div>
          </div>
        </div>
      </section>

      <section className="cp-section" aria-labelledby="cpt-zakat">
        <h2 id="cpt-zakat" className="cp-h">
          حاسبة زكاة الذهب
        </h2>
        <div className="calc-card">
          <div className="calc-row">
            <div className="calc-group">
              <label>وزن الذهب (جرام)</label>
              <NumberInput value={zWeight} onChange={setZWeight} className="calc-input calc-input-num" />
            </div>
            <div className="calc-group">
              <label>العيار</label>
              <select className="calc-input calc-select" value={zKarat} onChange={(e) => setZKarat(e.target.value)}>
                {GOLD_KARATS.map((k) => (
                  <option key={k} value={k}>
                    عيار {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="calc-result-box">
            <div className="calc-result-label">
              {zakat == null ? 'الزكاة المستحقة' : zakat.due ? 'الزكاة المستحقة (2.5%)' : 'لم يبلغ النصاب'}
            </div>
            <div className="calc-result-value">{zakat ? money(zakat.amount) : '—'}</div>
            <div className="calc-result-unit">{c.currencyName}</div>
          </div>
          {zakat ? (
            <p className="cp-note" style={{ marginTop: 10 }}>
              قيمة ذهبك {money(zakat.value)} {c.short}، وفيه {formatMoney(zakat.pure, 2)} جرام ذهب خالص. النصاب
              85 جرام ذهب خالص، وتجب الزكاة بعد مرور سنة هجرية كاملة على امتلاكه.
            </p>
          ) : null}
        </div>
      </section>

      <p className="cp-note">
        الحسابات استرشادية بناءً على السعر العالمي بدون مصنعية أو ضريبة، ولا تُغني عن استشارة أهل العلم في
        الزكاة.
      </p>

      <nav className="cp-others" aria-label="أدوات أخرى">
        <ul>
          <li>
            <Link to={`/${code}/currencies`}>
              <span>محوّل العملات</span>
            </Link>
          </li>
          <li>
            <Link to={`/${code}/crypto`}>
              <span>العملات الرقمية</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

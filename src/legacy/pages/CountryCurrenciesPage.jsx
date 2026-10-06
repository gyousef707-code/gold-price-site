import { useEffect, useMemo, useState } from 'react';
import useApiData from '../hooks/useApiData.js';
import NumberInput from '../components/NumberInput.jsx';
import CountryHero, { formatTime } from '../components/CountryHero.jsx';
import { COUNTRIES, flagUrl, smartMoney } from '../data/countries.js';

// أسماء وأعلام العملات (مختصرة عشان الصفحة تفضل خفيفة)
const CUR = {
  usd: ['دولار أمريكي', 'us'],
  eur: ['يورو', 'eu'],
  gbp: ['جنيه إسترليني', 'gb'],
  sar: ['ريال سعودي', 'sa'],
  aed: ['درهم إماراتي', 'ae'],
  kwd: ['دينار كويتي', 'kw'],
  qar: ['ريال قطري', 'qa'],
  bhd: ['دينار بحريني', 'bh'],
  omr: ['ريال عماني', 'om'],
  jod: ['دينار أردني', 'jo'],
  egp: ['جنيه مصري', 'eg'],
  chf: ['فرنك سويسري', 'ch'],
  jpy: ['ين ياباني', 'jp'],
  cny: ['يوان صيني', 'cn'],
  try: ['ليرة تركية', 'tr'],
};

export default function CountryCurrenciesPage({ code, initialData = null }) {
  const c = COUNTRIES[code];
  const { data, error } = useApiData(`/api/public/country-prices?c=${code}&t=currencies`, {
    intervalMs: 2 * 60000,
    initialData,
  });
  const [time, setTime] = useState('');
  useEffect(() => {
    setTime(formatTime(data?.updated_at));
  }, [data?.updated_at]);

  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState(c?.currency || 'usd');
  const [to, setTo] = useState('usd');

  // قيمة وحدة من كل عملة بعملة الدولة (عملة الدولة نفسها = 1)
  const table = useMemo(() => {
    if (!data?.rates || !c) return null;
    return { ...data.rates, [c.currency]: 1 };
  }, [data, c]);

  if (!c) return null;
  const codes = table ? Object.keys(table) : [];
  const result = table && table[from] && table[to] ? (Number(amount) || 0) * (table[from] / table[to]) : null;
  const rows = data?.rates ? Object.entries(data.rates) : [];

  return (
    <div className="cp" data-country={code}>
      <CountryHero code={code} title={`أسعار العملات في ${c.name}`} fx={data?.fx} time={time} />

      <section className="cp-section" aria-labelledby="cpc-conv">
        <h2 id="cpc-conv" className="cp-h">
          محوّل العملات
        </h2>
        <div className="calc-card">
          <div className="calc-row">
            <div className="calc-group">
              <label>المبلغ</label>
              <NumberInput value={amount} onChange={setAmount} className="calc-input calc-input-num" />
            </div>
          </div>
          <div className="calc-row">
            <div className="calc-group">
              <label>من</label>
              <select className="calc-input calc-select" value={from} onChange={(e) => setFrom(e.target.value)}>
                {(codes.length ? codes : [c.currency]).map((k) => (
                  <option key={k} value={k}>
                    {(CUR[k] || [k.toUpperCase()])[0]}
                  </option>
                ))}
              </select>
            </div>
            <div className="calc-group">
              <label>إلى</label>
              <select className="calc-input calc-select" value={to} onChange={(e) => setTo(e.target.value)}>
                {(codes.length ? codes : ['usd']).map((k) => (
                  <option key={k} value={k}>
                    {(CUR[k] || [k.toUpperCase()])[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="calc-result-box">
            <div className="calc-result-label">النتيجة</div>
            <div className="calc-result-value">{result != null ? smartMoney(result) : '—'}</div>
            <div className="calc-result-unit">{(CUR[to] || [to.toUpperCase()])[0]}</div>
          </div>
        </div>
      </section>

      <section className="cp-section" aria-labelledby="cpc-list">
        <h2 id="cpc-list" className="cp-h">
          سعر كل عملة مقابل {c.currencyName}
        </h2>
        {error && !data ? (
          <p className="cp-error">تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.</p>
        ) : (
          <ul className="cp-rows">
            {(rows.length ? rows : Array.from({ length: 6 }, (_, i) => [`sk${i}`, null])).map(([k, v]) => {
              const [name, flag] = CUR[k] || [k.toUpperCase(), null];
              return (
                <li key={k} className="cp-row">
                  <span className="cp-row-main">
                    {flag ? (
                      <img src={flagUrl(flag, 40)} width="28" height="21" alt="" loading="lazy" />
                    ) : (
                      <span className="cp-row-noflag" />
                    )}
                    <span className="cp-row-name">{v == null ? <span className="cp-skel" /> : name}</span>
                  </span>
                  <span className="cp-row-val">
                    {v == null ? '—' : smartMoney(v)} <small>{c.short}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="cp-note">
        الأسعار استرشادية، محسوبة من أسعار الصرف العالمية مقابل {c.currencyName}، وقد تختلف عن أسعار البنوك
        ومحلات الصرافة في {c.name}.
      </p>
    </div>
  );
}

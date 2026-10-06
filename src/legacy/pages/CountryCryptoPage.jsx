import { useEffect, useState } from 'react';
import useApiData from '../hooks/useApiData.js';
import CountryHero, { formatTime } from '../components/CountryHero.jsx';
import { COUNTRIES, smartMoney } from '../data/countries.js';

export default function CountryCryptoPage({ code, initialData = null }) {
  const c = COUNTRIES[code];
  const { data, error } = useApiData(`/api/public/country-prices?c=${code}&t=crypto`, {
    intervalMs: 2 * 60000,
    initialData,
  });
  const [time, setTime] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    setTime(formatTime(data?.updated_at));
  }, [data?.updated_at]);

  if (!c) return null;
  const coins = (data?.coins || []).filter((k) => {
    const s = q.trim().toLowerCase();
    return !s || k.name?.toLowerCase().includes(s) || k.symbol?.toLowerCase().includes(s);
  });

  return (
    <div className="cp" data-country={code}>
      <CountryHero code={code} title={`أسعار العملات الرقمية في ${c.name}`} fx={data?.fx} time={time} />

      <section className="cp-section" aria-labelledby="cpk-h">
        <h2 id="cpk-h" className="cp-h">
          أعلى 20 عملة رقمية بـ{c.currencyName}
        </h2>
        <input
          className="calc-input cp-search"
          type="search"
          placeholder="دوّر على عملة..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="بحث عن عملة رقمية"
        />
        {error && !data ? (
          <p className="cp-error">تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.</p>
        ) : (
          <ul className="cp-rows cp-coins">
            {(data ? coins : Array.from({ length: 8 }, (_, i) => ({ id: `sk${i}`, skeleton: true }))).map((k) => (
              <li key={k.id} className="cp-row">
                <span className="cp-row-main">
                  <span className="cp-coin-sym">{k.skeleton ? '' : (k.symbol || '').slice(0, 4)}</span>
                  <span className="cp-row-name">
                    {k.skeleton ? <span className="cp-skel" /> : k.name}
                    {!k.skeleton ? <small className="cp-sub">${smartMoney(k.price_usd)}</small> : null}
                  </span>
                </span>
                <span className="cp-row-val">
                  {k.skeleton ? '—' : smartMoney(k.price_local)} <small>{c.short}</small>
                  {!k.skeleton && k.change_24h != null ? (
                    <em className={`cp-change ${k.change_24h >= 0 ? 'up' : 'down'}`}>
                      {k.change_24h >= 0 ? '▲' : '▼'} {Math.abs(k.change_24h).toFixed(2)}%
                    </em>
                  ) : null}
                </span>
              </li>
            ))}
            {data && !coins.length ? <li className="cp-row cp-empty">مفيش عملة بالاسم ده</li> : null}
          </ul>
        )}
      </section>

      <p className="cp-note">
        الأسعار استرشادية، محسوبة من سعر العملة الرقمية بالدولار بسعر صرف {c.currencyName} (
        {data?.fx ?? '—'} لكل دولار). التعامل في العملات الرقمية ينطوي على مخاطرة عالية، وقد يكون غير مرخّص في
        بعض الدول، فتأكد من القوانين المحلية في {c.name}.
      </p>
    </div>
  );
}

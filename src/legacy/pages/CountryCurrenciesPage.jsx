import { useMemo, useRef, useState } from 'react';
import FaIcon from '../components/FaIcon.jsx';
import CurrencyConverter from '../components/CurrencyConverter.jsx';
import LivePrice from '../components/LivePrice.jsx';
import UpdatedStamp from '../components/UpdatedStamp.jsx';
import CountryHero from '../components/CountryHero.jsx';
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';
import { CURRENCY_META, CURRENCY_ORDER } from '../data/currencies.js';
import { COUNTRIES } from '../data/countries.js';

// عدد خانات مناسب لحجم الرقم (الأرقام الصغيرة زي الين محتاجة خانات أكتر)
const decFor = (v) => (v >= 100 ? 2 : v >= 1 ? 3 : v >= 0.01 ? 4 : 5);

// نفس صفحة العملات في مصر: محوّل عملات + قائمة كروت، لكن مقابل عملة الدولة
export default function CountryCurrenciesPage({ code, initialData = null }) {
  const c = COUNTRIES[code];
  const { lang } = useLang();
  const { data, loading, error } = useApiData(`/api/public/country-prices?c=${code}&t=currencies`, {
    intervalMs: 2 * 60000,
    initialData,
  });
  const [selected, setSelected] = useState(null);
  const converterRef = useRef(null);

  // الـ API بيرجّع أرقام مجرّدة، والمحوّل محتاج { mid } زي مصر
  const rates = useMemo(() => {
    if (!data?.rates) return null;
    const out = {};
    for (const [k, v] of Object.entries(data.rates)) out[k] = { mid: v };
    return out;
  }, [data]);

  if (!c) return null;
  const local = c.currency;
  const order = [...CURRENCY_ORDER.filter((k) => k !== local), 'egp'];

  const pick = (k) => {
    setSelected(k);
    converterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="cp" data-country={code}>
      <CountryHero code={code} title={`أسعار العملات في ${c.name}`} fx={data?.fx} live={false} />

      <section id="tool-currency-converter" ref={converterRef}>
        <div className="section-title-bar">
          <h2>
            <FaIcon icon="fa-solid fa-right-left" /> محوّل العملات
          </h2>
        </div>
        <CurrencyConverter rates={rates} selected={selected} base={local} />
        <UpdatedStamp lang={lang} date={data?.updated_at} />
      </section>

      <section>
        <div className="section-title-bar">
          <h2>
            <FaIcon icon="fa-solid fa-list" /> أسعار العملات مقابل {c.currencyName}
          </h2>
        </div>
        {loading && !data && <p className="loading-text">جاري التحميل...</p>}
        {error && !data && !loading && <p className="error-text">تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.</p>}
        <div className="currency-list-new">
          {order.map((k) => {
            const v = data?.rates?.[k];
            const meta = CURRENCY_META[k];
            if (!meta) return null;
            return (
              <div
                key={k}
                role="button"
                tabIndex={0}
                className={`currency-card-new${selected === k ? ' selected' : ''}`}
                onClick={() => pick(k)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick(k)}
                title="استخدمها في المحول"
              >
                <div className="currency-card-left">
                  <div className="currency-card-flag">
                    <img
                      src={`https://flagcdn.com/32x24/${meta.flag}.png`}
                      width="24"
                      height="18"
                      alt={k}
                      loading="lazy"
                      style={{ borderRadius: 4 }}
                    />
                  </div>
                  <div className="currency-card-info">
                    <div className="currency-card-name">{meta.name}</div>
                    <div className="currency-card-code">
                      {k.toUpperCase()} / {local.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="currency-card-right">
                  <div className="currency-card-price-box">
                    <div className="currency-card-price-label">السعر</div>
                    <div className="currency-card-price-value">
                      <LivePrice value={v ?? null} decimals={v != null ? decFor(v) : 2} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="cp-note">
        الأسعار استرشادية، محسوبة من أسعار الصرف العالمية مقابل {c.currencyName}، وقد تختلف عن أسعار البنوك
        ومحلات الصرافة في {c.name}.
      </p>
    </div>
  );
}

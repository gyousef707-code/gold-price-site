import { lazy, useEffect, useState } from 'react';
import useApiData from '../hooks/useApiData.js';
import CountryHero, { formatTime } from '../components/CountryHero.jsx';
import LazyOnView from '../components/LazyOnView.jsx';
import FaIcon from '../components/FaIcon.jsx';
import { COUNTRIES, SILVER_PURITIES, formatMoney } from '../data/countries.js';

const CountrySilverCalc = lazy(() =>
  import('../components/CountryCalculators.jsx').then((m) => ({ default: m.CountrySilverCalc }))
);

export default function CountrySilverPage({ code, initialData = null }) {
  const c = COUNTRIES[code];
  const { data, error } = useApiData(`/api/public/country-prices?c=${code}&t=gold`, {
    intervalMs: 60000,
    initialData,
  });
  const [time, setTime] = useState('');
  useEffect(() => {
    setTime(formatTime(data?.updated_at));
  }, [data?.updated_at]);

  if (!c) return null;
  const dec = c.decimals ?? 2;
  const money = (v) => formatMoney(v, dec);
  const silver = data?.silver;
  const gramOf = (p) => silver?.grams?.find((x) => x.purity === p)?.gram;

  return (
    <div className="cp" data-country={code}>
      <CountryHero code={code} title={`أسعار الفضة في ${c.name}`} fx={data?.fx} time={time} />

      <section className="cp-section" aria-labelledby="cps-h">
        <h2 id="cps-h" className="cp-h">
          سعر جرام الفضة بـ{c.currencyName}
        </h2>
        {error && !data ? (
          <p className="cp-error">تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.</p>
        ) : (
          <div className="cp-karat-grid">
            {SILVER_PURITIES.map((p) => (
              <article key={p} className="cp-karat cp-karat-silver">
                <p className="cp-karat-name">
                  فضة <b>{p}</b>
                </p>
                <p className="cp-karat-price">
                  {silver ? money(gramOf(p)) : <span className="cp-skel" aria-hidden="true" />}
                </p>
                <p className="cp-karat-unit">{c.short} / جرام</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="cp-section cp-ounce" aria-labelledby="cps-oz">
        <h2 id="cps-oz" className="cp-h">
          أونصة الفضة العالمية
        </h2>
        <div className="cp-ounce-box">
          <div>
            <p className="cp-ounce-usd">{silver ? `$${formatMoney(silver.ounce_usd, 2)}` : '—'}</p>
            <p className="cp-ounce-note">دولار أمريكي للأونصة</p>
          </div>
          <div className="cp-ounce-side">
            <p className="cp-ounce-local">
              {silver ? `${money(silver.ounce_local)} ${c.short}` : '—'}
            </p>
          </div>
        </div>
      </section>

      <p className="cp-note">
        الأسعار استرشادية، محسوبة من سعر الأونصة العالمي بسعر صرف {c.currencyName} ({data?.fx ?? '—'} لكل
        دولار)، ولا تشمل المصنعية ولا الضريبة.
      </p>

      <section id="tool-silver-calc-section" className="cp-section">
        <div className="section-title-bar">
          <h2>
            <FaIcon icon="fa-solid fa-gem" /> أدوات الفضة
          </h2>
        </div>
        <LazyOnView minHeight={380}>
          <CountrySilverCalc code={code} data={data} />
        </LazyOnView>
      </section>

      <section className="cp-section cp-about" aria-labelledby="cps-about">
        <h2 id="cps-about" className="cp-h">
          عن سعر الفضة في {c.name}
        </h2>
        <p>
          يتداول الناس في {c.name} الفضة بعيارات مختلفة، وأشهرها فضة 999 (النقية) وفضة 925 (الاسترليني)
          المستخدمة في المجوهرات، وفضة 900 و800 للقطع والأواني. نعرض لك سعر جرام كل عيار بـ{c.currencyName}{' '}
          محسوباً من السعر العالمي للأونصة، لتقارنه بسعر المحل قبل الشراء.
        </p>
      </section>
    </div>
  );
}

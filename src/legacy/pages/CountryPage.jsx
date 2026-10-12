import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import useApiData from '../hooks/useApiData.js';
import CountryHero, { formatTime } from '../components/CountryHero.jsx';
import CalcTabs from '../components/CalcTabs.jsx';
import LazyOnView from '../components/LazyOnView.jsx';
import CountryOunceCard from '../components/CountryOunceCard.jsx';
import TradingViewChart from '../components/TradingViewChart.jsx';
import FaIcon from '../components/FaIcon.jsx';
import {
  COUNTRIES,
  ACTIVE_COUNTRY_CODES,
  GOLD_KARATS,
  flagUrl,
  formatMoney,
} from '../data/countries.js';

const PriceHistoryChart = lazy(() => import('../components/PriceHistoryChart.jsx'));
const CountryGoldCalc = lazy(() =>
  import('../components/CountryCalculators.jsx').then((m) => ({ default: m.CountryGoldCalc }))
);
const CountryZakatCalc = lazy(() =>
  import('../components/CountryCalculators.jsx').then((m) => ({ default: m.CountryZakatCalc }))
);

function Change({ value }) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const n = Number(value);
  const up = n >= 0;
  return (
    <span className={`cp-change ${up ? 'up' : 'down'}`}>
      {up ? '▲' : '▼'} {Math.abs(n).toFixed(2)}%
    </span>
  );
}

export default function CountryPage({ code, initialData = null }) {
  const c = COUNTRIES[code];
  const { data, error, loading } = useApiData(`/api/public/country-prices?c=${code}&t=gold`, {
    intervalMs: 60000,
    initialData,
  });
  const [time, setTime] = useState('');

  // الوقت بيتحسب في المتصفح بس (بتوقيت الزائر) عشان ميحصلش اختلاف بين السيرفر والمتصفح
  useEffect(() => {
    setTime(formatTime(data?.updated_at));
  }, [data?.updated_at]);

  if (!c) return null;
  const dec = c.decimals ?? 2;
  const money = (v) => formatMoney(v, dec);
  const karatPrice = (k) => data?.karats?.find((x) => x.karat === k)?.gram;
  const others = ACTIVE_COUNTRY_CODES.filter((x) => x !== code);

  return (
    <div className="cp" data-country={code}>
      <CountryHero
        code={code}
        title={`أسعار الذهب في ${c.name}`}
        fx={data?.fx}
        time={time}
      />

      <CountryOunceCard
        code={code}
        title="سعر أونصة الذهب العالمية"
        ounceUsd={data?.ounce_usd}
        ounceLocal={data?.ounce_local}
        change={data?.ounce_change_percent}
        updatedAt={data?.updated_at}
      />

      <section id="tool-gold-karats" className="cp-section" aria-labelledby="cp-karats-h">
        <h2 id="cp-karats-h" className="cp-h">
          سعر جرام الذهب بـ{c.currencyName}
        </h2>
        {error && !data ? (
          <p className="cp-error">تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.</p>
        ) : (
          <div className="cp-karat-grid">
            {GOLD_KARATS.map((k) => {
              const v = karatPrice(k);
              return (
                <Link key={k} to={`${c.path}/gold/${k}`} className="cp-karat" aria-label={`سعر الذهب عيار ${k} في ${c.name}`}>
                  <p className="cp-karat-name">
                    <b>{k}</b> عيار
                  </p>
                  <p className="cp-karat-price">
                    {data ? money(v) : <span className="cp-skel" aria-hidden="true" />}
                  </p>
                  <p className="cp-karat-unit">{c.short} / جرام</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section id="tool-gold-calc-section" className="cp-section">
        <div className="section-title-bar">
          <h2>
            <FaIcon icon="fa-solid fa-calculator" /> أدوات الذهب
          </h2>
        </div>
        <LazyOnView minHeight={430}>
          <CalcTabs
            tabs={[
              { id: 'tool-gold-value', label: 'قيمة الذهب', render: () => <CountryGoldCalc code={code} data={data} /> },
              { id: 'tool-zakat-calc', label: 'الزكاة', render: () => <CountryZakatCalc code={code} data={data} /> },
            ]}
          />
        </LazyOnView>
      </section>

      <section className="cp-section" aria-label="تطور سعر الذهب عيار 21">
        <LazyOnView minHeight={330}>
          <Suspense fallback={null}>
            <PriceHistoryChart
              endpoint={`/api/public/country-history?c=${code}`}
              titleAr={`تطور سعر ذهب عيار 21 في ${c.name}`}
              titleEn="Gold 21K price trend"
              dataKey="karat21"
              unitAr={c.short}
              unitEn={c.currency.toUpperCase()}
              livePrice={karatPrice(21) ?? null}
            />
          </Suspense>
        </LazyOnView>
      </section>

      <section className="cp-section" aria-labelledby="cp-chart-h">
        <h2 id="cp-chart-h" className="cp-h">
          الرسم البياني لسعر الذهب العالمي
        </h2>
        <LazyOnView minHeight={380}>
          <TradingViewChart symbol="OANDA:XAUUSD" id={`tradingview-gold-${code}`} timezone={c.tz} />
        </LazyOnView>
        <p className="cp-note">الرسم بالدولار للأونصة العالمية (XAU/USD)، وهو الأساس اللي بيتحسب منه سعر كل عيار.</p>
      </section>

      <p className="cp-note">
        الأسعار استرشادية، محسوبة من السعر العالمي بسعر الصرف المعروض، ولا تشمل المصنعية ولا
        الضريبة.
      </p>

      <section className="cp-section cp-about" aria-labelledby="cp-about-h">
        <h2 id="cp-about-h" className="cp-h">
          عن سعر الذهب في {c.name}
        </h2>
        <p>{c.about}</p>
        <div className="cp-faq">
          {c.faq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <nav className="cp-others" aria-label="أسعار الذهب في دول أخرى">
        <h2 className="cp-h">أسعار الذهب في دول أخرى</h2>
        <ul>
          <li>
            <Link to="/">
              <span>مصر</span>
            </Link>
          </li>
          {others.map((x) => (
            <li key={x}>
              <Link to={COUNTRIES[x].path}>
                <img
                  src={flagUrl(COUNTRIES[x].flag, 40)}
                  width="20"
                  height="15"
                  alt=""
                  loading="lazy"
                />
                <span>{COUNTRIES[x].name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

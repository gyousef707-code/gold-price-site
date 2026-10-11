import { lazy, useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import useApiData from '../hooks/useApiData.js';
import CountryHero, { formatTime } from '../components/CountryHero.jsx';
import LazyOnView from '../components/LazyOnView.jsx';
import TradingViewChart from '../components/TradingViewChart.jsx';
import FaIcon from '../components/FaIcon.jsx';
import {
  COUNTRIES,
  ACTIVE_COUNTRY_CODES,
  KARATS_ALL,
  KARAT_PURITY,
  KARAT_INFO,
  flagUrl,
  formatMoney,
} from '../data/countries.js';

const CountryGoldCalc = lazy(() =>
  import('../components/CountryCalculators.jsx').then((m) => ({ default: m.CountryGoldCalc }))
);

const GRAMS_PER_OUNCE = 31.1034768;
const WEIGHTS = [1, 5, 10, 20, 50, 100];
const EGYPT_KARATS = [24, 22, 21, 18, 14, 12];

export default function CountryKaratPage({ code, karat, initialData = null }) {
  const c = COUNTRIES[code];
  const info = KARAT_INFO[karat];
  const { data, error } = useApiData(`/api/public/country-prices?c=${code}&t=gold`, {
    intervalMs: 60000,
    initialData,
  });
  const [time, setTime] = useState('');
  useEffect(() => {
    setTime(formatTime(data?.updated_at));
  }, [data?.updated_at]);

  if (!c || !info) return null;
  const dec = c.decimals ?? 2;
  const money = (v) => (v == null ? '—' : formatMoney(v, dec));

  // سعر جرام العيار بعملة الدولة: الأونصة المحلية ÷ جرامات الأونصة × نقاء العيار
  const gram = data?.ounce_local ? (data.ounce_local / GRAMS_PER_OUNCE) * KARAT_PURITY[karat] : null;
  const gramUsd = gram != null && data?.fx ? gram / data.fx : null;
  const otherCountries = ACTIVE_COUNTRY_CODES.filter((x) => x !== code);

  return (
    <div className="cp" data-country={code}>
      <CountryHero
        code={code}
        title={`سعر الذهب عيار ${karat} في ${c.name}`}
        subtitle={`${info.label} • نقاء ${info.percent}%`}
        fx={data?.fx}
        time={time}
      />

      <section className="cp-section" aria-labelledby="ck-price-h">
        <h2 id="ck-price-h" className="cp-h">
          سعر جرام الذهب عيار {karat} بـ{c.currencyName}
        </h2>
        {error && !data ? (
          <p className="cp-error">تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.</p>
        ) : (
          <article className="cp-karat cp-karat-hero">
            <p className="cp-karat-name">
              <b>{karat}</b> عيار
            </p>
            <p className="cp-karat-price">{data ? money(gram) : <span className="cp-skel" aria-hidden="true" />}</p>
            <p className="cp-karat-unit">{c.short} / جرام</p>
            {gramUsd != null ? (
              <p className="cp-karat-usd">≈ ${formatMoney(gramUsd, 2)} للجرام الواحد</p>
            ) : null}
          </article>
        )}
      </section>

      <section className="cp-section" aria-labelledby="ck-weights-h">
        <h2 id="ck-weights-h" className="cp-h">
          سعر الذهب عيار {karat} بالوزن
        </h2>
        <ul className="cp-rows">
          {WEIGHTS.map((w) => (
            <li key={w} className="cp-row">
              <span className="cp-row-main">
                <span className="cp-row-name">{w} جرام</span>
              </span>
              <span className="cp-row-val">
                {gram != null ? money(gram * w) : '—'} <small>{c.short}</small>
              </span>
            </li>
          ))}
          <li className="cp-row">
            <span className="cp-row-main">
              <span className="cp-row-name">أونصة ({formatMoney(GRAMS_PER_OUNCE, 2)} جرام)</span>
            </span>
            <span className="cp-row-val">
              {gram != null ? money(gram * GRAMS_PER_OUNCE) : '—'} <small>{c.short}</small>
            </span>
          </li>
        </ul>
        <p className="cp-note">
          الأسعار استرشادية، محسوبة من السعر العالمي بسعر الصرف المعروض، ولا تشمل المصنعية ولا الضريبة.
        </p>
      </section>

      <section id="tool-gold-calc-section" className="cp-section">
        <div className="section-title-bar">
          <h2>
            <FaIcon icon="fa-solid fa-calculator" /> احسب قيمة ذهبك عيار {karat}
          </h2>
        </div>
        <LazyOnView minHeight={380}>
          <CountryGoldCalc code={code} data={data} initialKarat={karat} />
        </LazyOnView>
      </section>

      <section className="cp-section" aria-labelledby="ck-chart-h">
        <h2 id="ck-chart-h" className="cp-h">
          الرسم البياني لسعر الذهب العالمي
        </h2>
        <LazyOnView minHeight={380}>
          <TradingViewChart symbol="OANDA:XAUUSD" id={`tradingview-gold-${code}-${karat}`} timezone={c.tz} />
        </LazyOnView>
        <p className="cp-note">الرسم بالدولار للأونصة العالمية (XAU/USD)، وهو الأساس اللي بيتحسب منه سعر كل عيار.</p>
      </section>

      <nav className="cp-section cp-karat-nav" aria-label="عيارات الذهب الأخرى">
        <h2 className="cp-h">عيارات الذهب الأخرى في {c.name}</h2>
        <ul className="cp-chips-nav">
          {KARATS_ALL.map((k) => (
            <li key={k}>
              <Link to={`${c.path}/gold/${k}`} className={k === karat ? 'active' : ''} aria-current={k === karat ? 'page' : undefined}>
                عيار {k}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="cp-section cp-about" aria-labelledby="ck-about-h">
        <h2 id="ck-about-h" className="cp-h">
          عن الذهب عيار {karat} في {c.name}
        </h2>
        <p>
          الذهب عيار {karat} نقاؤه {info.percent}% ({karat}/24 ذهب خالص). {info.use}
        </p>
        <div className="cp-faq">
          <details>
            <summary>
              كم سعر جرام الذهب عيار {karat} اليوم في {c.name}؟
            </summary>
            <p>
              سعر الجرام الآن {gram != null ? `${money(gram)} ${c.short}` : 'بيتحمّل...'}، وبيتحدث لحظة بلحظة مع
              حركة الأونصة العالمية.
            </p>
          </details>
          <details>
            <summary>كيف يُحسب سعر عيار {karat} بـ{c.currencyName}؟</summary>
            <p>
              نقسم سعر الأونصة العالمية بالدولار على {formatMoney(GRAMS_PER_OUNCE, 4)} (جرامات الأونصة)، ونضرب
              في نقاء العيار ({info.percent}%)، ثم في سعر صرف {c.currencyName}.
            </p>
          </details>
          <details>
            <summary>هل السعر المعروض يشمل المصنعية والضريبة؟</summary>
            <p>
              لا، هو السعر العالمي بعملة {c.name} بدون مصنعية أو ضريبة. محلات الذهب بتضيف عليه حسب تصميم القطعة،
              فقارن دايماً قبل الشراء.
            </p>
          </details>
        </div>
      </section>

      <nav className="cp-others" aria-label={`سعر الذهب عيار ${karat} في دول أخرى`}>
        <h2 className="cp-h">سعر الذهب عيار {karat} في دول أخرى</h2>
        <ul>
          {EGYPT_KARATS.includes(karat) ? (
            <li>
              <Link to={`/gold/${karat}`}>
                <span>مصر</span>
              </Link>
            </li>
          ) : null}
          {otherCountries.map((x) => (
            <li key={x}>
              <Link to={`${COUNTRIES[x].path}/gold/${karat}`}>
                <img src={flagUrl(COUNTRIES[x].flag, 40)} width="20" height="15" alt="" loading="lazy" />
                <span>{COUNTRIES[x].name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

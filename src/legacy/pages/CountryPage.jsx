import { useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import useApiData from '../hooks/useApiData.js';
import {
  COUNTRIES,
  ACTIVE_COUNTRY_CODES,
  GOLD_KARATS,
  SILVER_PURITIES,
  countryThemeCss,
  flagUrl,
  formatMoney,
} from '../data/countries.js';

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
  const { data, error, loading } = useApiData(`/api/public/country-prices?c=${code}`, {
    intervalMs: 60000,
    initialData,
  });
  const [time, setTime] = useState('');

  // الوقت بيتحسب في المتصفح بس (بتوقيت الزائر) عشان ميحصلش اختلاف بين السيرفر والمتصفح
  useEffect(() => {
    if (!data?.updated_at) return;
    setTime(
      new Date(data.updated_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    );
  }, [data?.updated_at]);

  if (!c) return null;
  const dec = c.decimals ?? 2;
  const money = (v) => formatMoney(v, dec);
  const karatPrice = (k) => data?.karats?.find((x) => x.karat === k)?.gram;
  const silverPrice = (p) => data?.silver?.grams?.find((x) => x.purity === p)?.gram;
  const others = ACTIVE_COUNTRY_CODES.filter((x) => x !== code);

  return (
    <div className="cp" data-country={code}>
      {/* ثيم الدولة: متغيرات ألوان بتتطبق على الصفحة كلها (الهيدر والقائمة السفلية كمان) */}
      <style dangerouslySetInnerHTML={{ __html: countryThemeCss(c) }} />

      <section className="cp-hero" data-pattern={c.pattern}>
        <div className="cp-flag">
          <img src={flagUrl(c.flag, 160)} width="76" height="76" alt={`علم ${c.name}`} />
        </div>
        <div className="cp-hero-text">
          <h1>أسعار الذهب في {c.name}</h1>
          <p className="cp-tagline">{c.tagline}</p>
        </div>
        <ul className="cp-chips">
          <li>{c.currencyName}</li>
          {data?.fx ? (
            <li>
              1 دولار = {Number(data.fx)} {c.short}
            </li>
          ) : null}
        </ul>
        <p className="cp-live">
          <span className="cp-dot" aria-hidden="true" />
          {time ? `آخر تحديث ${time}` : 'السعر لحظي'}
        </p>
      </section>

      <section className="cp-section" aria-labelledby="cp-karats-h">
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
                <article key={k} className="cp-karat">
                  <p className="cp-karat-name">
                    <b>{k}</b> عيار
                  </p>
                  <p className="cp-karat-price">
                    {data ? money(v) : <span className="cp-skel" aria-hidden="true" />}
                  </p>
                  <p className="cp-karat-unit">{c.short} / جرام</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="cp-section cp-ounce" aria-labelledby="cp-ounce-h">
        <h2 id="cp-ounce-h" className="cp-h">
          الأونصة العالمية
        </h2>
        <div className="cp-ounce-box">
          <div>
            <p className="cp-ounce-usd">{data ? `$${formatMoney(data.ounce_usd, 2)}` : '—'}</p>
            <p className="cp-ounce-note">دولار أمريكي للأونصة</p>
          </div>
          <div className="cp-ounce-side">
            <p className="cp-ounce-local">
              {data ? `${money(data.ounce_local)} ${c.short}` : '—'}
            </p>
            <Change value={data?.ounce_change_percent} />
          </div>
        </div>
      </section>

      {data?.silver ? (
        <section className="cp-section" aria-labelledby="cp-silver-h">
          <h2 id="cp-silver-h" className="cp-h">
            سعر جرام الفضة بـ{c.currencyName}
          </h2>
          <div className="cp-silver-grid">
            {SILVER_PURITIES.map((p) => (
              <article key={p} className="cp-silver">
                <p className="cp-silver-name">فضة {p}</p>
                <p className="cp-silver-price">
                  {money(silverPrice(p))} <small>{c.short}</small>
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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

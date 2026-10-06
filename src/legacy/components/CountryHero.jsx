import { COUNTRIES, flagUrl } from '../data/countries.js';

// غلاف مشترك لكل صفحات الدولة: علم + عنوان + عملة + وقت التحديث
export default function CountryHero({ code, title, subtitle, fx, time, live = true }) {
  const c = COUNTRIES[code];
  if (!c) return null;
  return (
    <section className="cp-hero" data-pattern={c.pattern}>
      <div className="cp-flag">
        <img src={flagUrl(c.flag, 160)} width="76" height="76" alt={`علم ${c.name}`} />
      </div>
      <div className="cp-hero-text">
        <h1>{title}</h1>
        <p className="cp-tagline">{subtitle || c.tagline}</p>
      </div>
      <ul className="cp-chips">
        <li>{c.currencyName}</li>
        {fx ? (
          <li>
            1 دولار = {Number(fx)} {c.short}
          </li>
        ) : null}
      </ul>
      {live ? (
        <p className="cp-live">
          <span className="cp-dot" aria-hidden="true" />
          {time ? `آخر تحديث ${time}` : 'السعر لحظي'}
        </p>
      ) : null}
    </section>
  );
}

// تحويل وقت التحديث لنص (بتوقيت الزائر) — بيتحسب في المتصفح بس
export function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

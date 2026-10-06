import { lazy } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import useApiData from '../hooks/useApiData.js';
import CountryHero from '../components/CountryHero.jsx';
import CalcTabs from '../components/CalcTabs.jsx';
import FaIcon from '../components/FaIcon.jsx';
import { COUNTRIES } from '../data/countries.js';

const CountryGoldCalc = lazy(() =>
  import('../components/CountryCalculators.jsx').then((m) => ({ default: m.CountryGoldCalc }))
);
const CountryZakatCalc = lazy(() =>
  import('../components/CountryCalculators.jsx').then((m) => ({ default: m.CountryZakatCalc }))
);
const CountrySilverCalc = lazy(() =>
  import('../components/CountryCalculators.jsx').then((m) => ({ default: m.CountrySilverCalc }))
);

export default function CountryToolsPage({ code, initialData = null }) {
  const c = COUNTRIES[code];
  const { data } = useApiData(`/api/public/country-prices?c=${code}&t=gold`, {
    intervalMs: 60000,
    initialData,
  });
  if (!c) return null;

  const links = [
    { to: `/${code}/currencies`, icon: 'fa-solid fa-right-left', title: 'محوّل العملات', desc: `التحويل مقابل ${c.currencyName}` },
    { to: `/${code}/crypto`, icon: 'fa-brands fa-bitcoin', title: 'حاسبة العملات الرقمية', desc: 'قيمة أي عملة رقمية' },
    { to: `/${code}`, icon: 'fa-solid fa-coins', title: 'عيارات الذهب بالتفصيل', desc: `أسعار الجرام بـ${c.currencyName}` },
    { to: `/${code}/silver`, icon: 'fa-solid fa-gem', title: 'أسعار الفضة', desc: 'كل عيارات الفضة' },
  ];

  return (
    <div className="cp" data-country={code}>
      <CountryHero
        code={code}
        title={`الأدوات والحاسبات في ${c.name}`}
        subtitle={`كل الحسابات بـ${c.currencyName}`}
        fx={data?.fx}
        live={false}
      />

      <section className="cp-section" aria-labelledby="cpt-h">
        <div className="section-title-bar">
          <h2 id="cpt-h">
            <FaIcon icon="fa-solid fa-calculator" /> الحاسبات
          </h2>
        </div>
        <CalcTabs
          tabs={[
            { id: 'tool-gold-value', label: 'قيمة الذهب', render: () => <CountryGoldCalc code={code} data={data} /> },
            { id: 'tool-zakat-calc', label: 'الزكاة', render: () => <CountryZakatCalc code={code} data={data} /> },
            { id: 'tool-silver-value', label: 'قيمة الفضة', render: () => <CountrySilverCalc code={code} data={data} /> },
          ]}
        />
      </section>

      <section className="cp-section" aria-labelledby="cpt-more">
        <div className="section-title-bar">
          <h2 id="cpt-more">
            <FaIcon icon="fa-solid fa-chart-simple" /> أدوات وأسعار أخرى
          </h2>
        </div>
        <div className="tools-list flex flex-col w-full">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              dir="rtl"
              className="tools-list-row tone-gold flex flex-row items-center justify-between w-full text-right"
            >
              <span className="tools-list-main flex flex-row items-center gap-3 min-w-0 text-right">
                <span className="tools-list-icon">
                  <FaIcon icon={l.icon} />
                </span>
                <span className="tools-list-text items-start text-right">
                  <span className="tools-list-title">{l.title}</span>
                  <span className="tools-list-desc">{l.desc}</span>
                </span>
              </span>
              <FaIcon icon="fa-solid fa-chevron-left" className="tools-list-arrow shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      <p className="cp-note">
        الحسابات استرشادية بناءً على السعر العالمي بدون مصنعية أو ضريبة، ولا تغني عن استشارة أهل العلم في
        الزكاة.
      </p>
    </div>
  );
}

import { useState } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import CountryHero from '../components/CountryHero.jsx';
import FaIcon from '../components/FaIcon.jsx';
import { COUNTRIES } from '../data/countries.js';

// نفس تصميم صفحة الأدوات في مصر: قائمة أدوات، كل أداة بتفتح مكانها جوه الدولة بنفس العملة والأسعار.

function ToolRow({ card }) {
  return (
    <Link
      to={card.to}
      dir="rtl"
      className={`tools-list-row tone-${card.tone} flex flex-row items-center justify-between w-full text-right`}
    >
      <span className="tools-list-main flex flex-row items-center gap-3 min-w-0 text-right">
        <span className="tools-list-icon">
          <FaIcon icon={card.icon} />
        </span>
        <span className="tools-list-text items-start text-right">
          <span className="tools-list-title">{card.title}</span>
          <span className="tools-list-desc">{card.desc}</span>
        </span>
      </span>
      <FaIcon icon="fa-solid fa-chevron-left" className="tools-list-arrow shrink-0" />
    </Link>
  );
}

export default function CountryToolsPage({ code }) {
  const c = COUNTRIES[code];
  // مقفولة افتراضيًا عشان الشاشة تفضل مضغوطة (زي مصر)
  const [calcOpen, setCalcOpen] = useState(false);
  if (!c) return null;

  const base = `/${code}`;
  const calculators = [
    { to: `${base}#tool-gold-value`, icon: 'fa-solid fa-calculator', title: 'حاسبة الذهب', desc: 'قيمة الذهب بالوزن والعيار', tone: 'gold' },
    { to: `${base}/silver#tool-silver-calc-section`, icon: 'fa-solid fa-gem', title: 'حاسبة الفضة', desc: 'قيمة الفضة بالوزن والعيار', tone: 'silver' },
    { to: `${base}/currencies#tool-currency-converter`, icon: 'fa-solid fa-right-left', title: 'محول العملات', desc: `التحويل بين العملات و${c.currencyName}`, tone: 'blue' },
    { to: `${base}#tool-zakat-calc`, icon: 'fa-solid fa-hand-holding-dollar', title: 'حاسبة زكاة الذهب', desc: 'زكاة الذهب 2.5%', tone: 'gold' },
  ];

  const sections = [
    {
      title: 'الأدوات',
      cards: [
        { to: `${base}/crypto#tool-crypto-calc`, icon: 'fa-brands fa-bitcoin', title: 'حاسبة العملات الرقمية', desc: 'قيمة أي عملة رقمية', tone: 'crypto' },
      ],
    },
    {
      title: 'الأسعار بالتفصيل',
      cards: [
        { to: `${base}#tool-gold-karats`, icon: 'fa-solid fa-coins', title: 'عيارات الذهب بالتفصيل', desc: `كل العيارات بـ${c.currencyName}`, tone: 'gold' },
        { to: `${base}/silver`, icon: 'fa-solid fa-gem', title: 'عيارات الفضة بالتفصيل', desc: 'كل عيارات الفضة', tone: 'silver' },
        { to: `${base}/crypto`, icon: 'fa-solid fa-chart-simple', title: 'العملات الرقمية بالتفصيل', desc: 'كل العملات', tone: 'crypto' },
      ],
    },
    {
      title: 'المزيد',
      cards: [
        { to: '/blog', icon: 'fa-regular fa-newspaper', title: 'المدونة والمقالات', desc: 'كل المقالات', tone: 'blue' },
        { to: '/contact', icon: 'fa-regular fa-envelope', title: 'اتصل بنا', desc: 'اقتراح أو استفسار', tone: 'silver' },
      ],
    },
  ];

  return (
    <div className="cp" data-country={code}>
      <CountryHero
        code={code}
        title={`الأدوات في ${c.name}`}
        subtitle={`حاسبات وأدوات بـ${c.currencyName}`}
        live={false}
      />

      <div className="tools-section w-full text-right">
        <h2 className="tools-section-title">الحاسبات</h2>
        <div className="tools-list flex flex-col w-full">
          <button
            type="button"
            dir="rtl"
            className="tools-list-row tone-gold flex flex-row items-center justify-between w-full text-right"
            aria-expanded={calcOpen}
            onClick={() => setCalcOpen((v) => !v)}
          >
            <span className="tools-list-main flex flex-row items-center gap-3 min-w-0 text-right">
              <span className="tools-list-icon">
                <FaIcon icon="fa-solid fa-calculator" />
              </span>
              <span className="tools-list-text items-start text-right">
                <span className="tools-list-title">الحاسبة</span>
                <span className="tools-list-desc">الذهب والفضة والعملات والزكاة</span>
              </span>
            </span>
            <FaIcon icon="fa-solid fa-chevron-left" className="tools-list-arrow shrink-0" />
          </button>

          <div className={`tools-sub${calcOpen ? ' open' : ''}`}>
            {calculators.map((card) => (
              <ToolRow key={card.to} card={card} />
            ))}
          </div>
        </div>
      </div>

      {sections.map((section) => (
        <div className="tools-section w-full text-right" key={section.title}>
          <h2 className="tools-section-title">{section.title}</h2>
          <div className="tools-list flex flex-col w-full">
            {section.cards.map((card) => (
              <ToolRow key={card.to} card={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

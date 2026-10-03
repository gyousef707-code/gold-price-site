import { useState } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import { useLang } from '../context/LangContext.jsx';
import FaIcon from '../components/FaIcon.jsx';

// الحاسبات الأساسية — بتتجمع كلها جوه عنصر واحد اسمه "الحاسبة" بيفتح بالضغط
const CALCULATORS = [
  { to: '/#tool-gold-calc', icon: 'fa-solid fa-calculator', ar: 'حاسبة الذهب', en: 'Gold calculator', arDesc: 'قيمة الذهب بالوزن والعيار', enDesc: 'Value by weight & karat', tone: 'gold' },
  { to: '/silver#tool-silver-calc', icon: 'fa-solid fa-gem', ar: 'حاسبة الفضة', en: 'Silver calculator', arDesc: 'قيمة الفضة بالوزن والعيار', enDesc: 'Value by weight & purity', tone: 'silver' },
  { to: '/currencies', icon: 'fa-solid fa-right-left', ar: 'محول العملات', en: 'Currency converter', arDesc: 'التحويل بين العملات', enDesc: 'Convert any currency', tone: 'blue' },
  { to: '/#tool-zakat-calc', icon: 'fa-solid fa-hand-holding-dollar', ar: 'حاسبة زكاة الذهب', en: 'Gold zakat calculator', arDesc: 'زكاة الذهب 2.5%', enDesc: '2.5% zakat', tone: 'gold' },
];

const SECTIONS = [
  {
    ar: 'الأدوات',
    en: 'Tools',
    cards: [
      { to: '/crypto#tool-crypto-calc', icon: 'fa-brands fa-bitcoin', ar: 'حاسبة العملات الرقمية', en: 'Crypto calculator', arDesc: 'قيمة أي عملة رقمية', enDesc: 'Any coin value', tone: 'crypto' },
      { to: '/alerts', icon: 'fa-regular fa-bell', ar: 'تنبيهات الأسعار', en: 'Price alerts', arDesc: 'اضبط تنبيهاتك الخاصة', enDesc: 'Set up your alerts', tone: 'blue' },
    ],
  },
  {
    ar: 'الأسعار بالتفصيل',
    en: 'Prices in detail',
    cards: [
      { to: '/#tool-gold-karats', icon: 'fa-solid fa-coins', ar: 'عيارات الذهب بالتفصيل', en: 'Gold karats', arDesc: 'كل العيارات', enDesc: 'Every karat', tone: 'gold' },
      { to: '/crypto#tool-crypto-details', icon: 'fa-solid fa-chart-simple', ar: 'العملات الرقمية بالتفصيل', en: 'Coins in detail', arDesc: 'كل العملات', enDesc: 'Every coin', tone: 'crypto' },
    ],
  },
  {
    ar: 'المزيد',
    en: 'More',
    cards: [
      { to: '/blog', icon: 'fa-regular fa-newspaper', ar: 'المدونة والمقالات', en: 'Blog & articles', arDesc: 'كل المقالات', enDesc: 'All articles', tone: 'blue' },
      { to: '/contact', icon: 'fa-regular fa-envelope', ar: 'اتصل بنا', en: 'Contact us', arDesc: 'اقتراح أو استفسار', enDesc: 'Ideas & support', tone: 'silver' },
    ],
  },
];

function ToolRow({ card, en }) {
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
          <span className="tools-list-title">{en ? card.en : card.ar}</span>
          <span className="tools-list-desc">{en ? card.enDesc : card.arDesc}</span>
        </span>
      </span>
      <FaIcon icon="fa-solid fa-chevron-left" className="tools-list-arrow shrink-0" />
    </Link>
  );
}

export default function ToolsPage() {
  const { t, lang } = useLang();
  const en = lang === 'en';
  // مقفولة افتراضيًا عشان الشاشة تفضل مضغوطة
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <div className="page-wrap flex flex-col items-end text-right" dir="rtl">
      <div className="tools-hero w-full text-right">
        <h1>{t('tools.title')}</h1>
        <p>{t('tools.subtitle')}</p>
      </div>

      <div className="tools-section w-full text-right">
        <h2 className="tools-section-title">{en ? 'Calculators' : 'الحاسبات'}</h2>
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
                <span className="tools-list-title">{en ? 'Calculator' : 'الحاسبة'}</span>
                <span className="tools-list-desc">
                  {en ? 'Gold, silver, currency & zakat' : 'الذهب والفضة والعملات والزكاة'}
                </span>
              </span>
            </span>
            <FaIcon icon="fa-solid fa-chevron-left" className="tools-list-arrow shrink-0" />
          </button>

          <div className={`tools-sub${calcOpen ? ' open' : ''}`}>
            {CALCULATORS.map((c) => (
              <ToolRow key={c.to + c.ar} card={c} en={en} />
            ))}
          </div>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <div className="tools-section w-full text-right" key={section.ar}>
          <h2 className="tools-section-title">{en ? section.en : section.ar}</h2>
          <div className="tools-list flex flex-col w-full">
            {section.cards.map((c) => (
              <ToolRow key={c.to + c.ar} card={c} en={en} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

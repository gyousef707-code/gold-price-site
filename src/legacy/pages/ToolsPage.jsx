import { Link } from '@/lib/router-compat.jsx';
import { useLang } from '../context/LangContext.jsx';

const CARDS = [
  { to: '/#tool-gold-calc', icon: 'fa-solid fa-calculator', ar: 'حاسبة الذهب', en: 'Gold calculator', arDesc: 'قيمة الذهب بالوزن والعيار', enDesc: 'Value by weight & karat', tone: 'gold' },
  { to: '/silver#tool-silver-calc', icon: 'fa-solid fa-gem', ar: 'حاسبة الفضة', en: 'Silver calculator', arDesc: 'قيمة الفضة بالوزن والعيار', enDesc: 'Value by weight & purity', tone: 'silver' },
  { to: '/#tool-zakat-calc', icon: 'fa-solid fa-hand-holding-dollar', ar: 'حاسبة زكاة الذهب', en: 'Gold zakat', arDesc: 'زكاة الذهب 2.5%', enDesc: '2.5% zakat', tone: 'gold' },
  { to: '/currencies', icon: 'fa-solid fa-right-left', ar: 'محول العملات', en: 'Currency converter', arDesc: 'التحويل بين العملات', enDesc: 'Convert any currency', tone: 'blue' },
  { to: '/crypto#tool-crypto-calc', icon: 'fa-brands fa-bitcoin', ar: 'حاسبة العملات الرقمية', en: 'Crypto calculator', arDesc: 'قيمة أي عملة رقمية', enDesc: 'Any coin value', tone: 'crypto' },
  { to: '/#tool-gold-savings', icon: 'fa-solid fa-piggy-bank', ar: 'ادخار الذهب', en: 'Gold savings', arDesc: 'خطط لادخارك بالذهب', enDesc: 'Plan your savings', tone: 'gold' },
  { to: '/silver#tool-silver-savings', icon: 'fa-solid fa-piggy-bank', ar: 'ادخار الفضة', en: 'Silver savings', arDesc: 'خطط لادخارك بالفضة', enDesc: 'Plan your savings', tone: 'silver' },
  { to: '/blog', icon: 'fa-regular fa-newspaper', ar: 'المدونة والمقالات', en: 'Blog & articles', arDesc: 'كل المقالات', enDesc: 'All articles', tone: 'blue' },
  { to: '/#tool-gold-karats', icon: 'fa-solid fa-coins', ar: 'عيارات الذهب بالتفصيل', en: 'Gold karats', arDesc: 'كل العيارات', enDesc: 'Every karat', tone: 'gold' },
  { to: '/crypto#tool-crypto-details', icon: 'fa-solid fa-chart-simple', ar: 'العملات الرقمية بالتفصيل', en: 'Coins in detail', arDesc: 'كل العملات', enDesc: 'Every coin', tone: 'crypto' },
  { to: '/notifications', icon: 'fa-regular fa-bell', ar: 'تنبيهات الأسعار', en: 'Price alerts', arDesc: 'كل تحركات السوق بوقتها', enDesc: 'Every move, timestamped', tone: 'blue' },
  { to: '/contact', icon: 'fa-regular fa-envelope', ar: 'اتصل بنا', en: 'Contact us', arDesc: 'اقتراح أو استفسار', enDesc: 'Ideas & support', tone: 'silver' },
];

export default function ToolsPage() {
  const { t, lang } = useLang();
  const en = lang === 'en';

  return (
    <div className="page-wrap">
      <div className="tools-hero">
        <h1>{t('tools.title')}</h1>
        <p>{t('tools.subtitle')}</p>
      </div>

      <div className="tools-grid">
        {CARDS.map((c) => (
          <Link key={c.to + c.ar} to={c.to} className={`tool-card-pro tone-${c.tone}`}>
            <span className="t-icon"><i className={c.icon} /></span>
            <h3>{en ? c.en : c.ar}</h3>
            <p>{en ? c.enDesc : c.arDesc}</p>
            <i className="fa-solid fa-chevron-left t-arrow" />
          </Link>
        ))}
      </div>
    </div>
  );
}

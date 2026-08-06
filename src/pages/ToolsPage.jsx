import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import GoldCalculator from '../components/calculators/GoldCalculator.jsx';
import SilverCalculator from '../components/calculators/SilverCalculator.jsx';
import ZakatCalculator from '../components/calculators/ZakatCalculator.jsx';
import CryptoCalculator from '../components/calculators/CryptoCalculator.jsx';
import SavingsCalculator from '../components/calculators/SavingsCalculator.jsx';
import { goldKarats } from '../data/gold.js';
import { cryptoDetails } from '../data/crypto.js';

const CARDS = [
  { anchor: 'tool-gold-calc', icon: 'fa-solid fa-calculator', title: 'حاسبة الذهب', desc: 'قيمة الذهب بالوزن والعيار' },
  { anchor: 'tool-silver-calc', icon: 'fa-solid fa-calculator', title: 'حاسبة الفضة', desc: 'قيمة الفضة بالوزن والعيار' },
  { anchor: 'tool-zakat-calc', icon: 'fa-solid fa-hand-holding-dollar', title: 'حاسبة زكاة الذهب', desc: 'زكاة الذهب 2.5%' },
  { anchor: 'tool-currency-convert', icon: 'fa-solid fa-right-left', title: 'محول العملات', desc: 'التحويل بين العملات' },
  { anchor: 'tool-crypto-calc', icon: 'fa-brands fa-bitcoin', title: 'حاسبة العملات الرقمية', desc: 'قيمة اي عملة رقمية' },
  { anchor: 'tool-gold-savings', icon: 'fa-solid fa-piggy-bank', title: 'ادخار الذهب', desc: 'خطط لادخارك بالذهب' },
  { anchor: 'tool-silver-savings', icon: 'fa-solid fa-piggy-bank', title: 'ادخار الفضة', desc: 'خطط لادخارك بالفضة' },
  { anchor: 'tool-blog', icon: 'fa-regular fa-newspaper', title: '📰 المدونة والمقالات', desc: 'كل المقالات', isLink: '/blog' },
  { anchor: 'tool-gold-karats', icon: 'fa-solid fa-coins', title: '🪙 عيارات الذهب بالتفصيل', desc: 'كل العيارات' },
  { anchor: 'tool-crypto-details', icon: 'fa-brands fa-btc', title: '₿ العملات الرقمية بالتفصيل', desc: 'كل العملات' },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function ToolsPage() {
  return (
    <div className="main-content">
      <Seo
        title="الأدوات والحاسبات | ذهبي"
        description="كل حاسبات ذهبي في مكان واحد: حاسبة الذهب، الفضة، الزكاة، محول العملات، حاسبة العملات الرقمية، وخطط الادخار."
        keywords="حاسبة الذهب, حاسبة زكاة الذهب, محول عملات"
        path="/tools"
      />

      <h1 style={{ fontSize: 20, marginBottom: 14 }}>الأدوات</h1>

      <div className="tools-grid">
        {CARDS.map((c) =>
          c.isLink ? (
            <Link key={c.anchor} to={c.isLink} className="tool-card">
              <i className={c.icon} />
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </Link>
          ) : (
            <button key={c.anchor} className="tool-card" onClick={() => scrollToId(c.anchor)} type="button">
              <i className={c.icon} />
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </button>
          )
        )}
      </div>

      <GoldCalculator />
      <SilverCalculator />
      <ZakatCalculator />

      <div className="calc-box" id="tool-currency-convert">
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>محول العملات</h3>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
          الحاسبة الكاملة موجودة في <Link to="/currencies">صفحة العملات</Link>
        </p>
      </div>

      <CryptoCalculator />
      <SavingsCalculator metal="gold" />
      <SavingsCalculator metal="silver" />

      <section id="tool-gold-karats">
        <div className="section-title-bar">
          <h2><i className="fa-solid fa-coins" /> عيارات الذهب بالتفصيل</h2>
        </div>
        <div className="carat-grid">
          {goldKarats.map((g) => (
            <Link key={g.karat} to={`/gold/${g.karat}`}>عيار {g.karat}</Link>
          ))}
        </div>
      </section>

      <section id="tool-crypto-details">
        <div className="section-title-bar">
          <h2><i className="fa-brands fa-bitcoin" /> العملات الرقمية بالتفصيل</h2>
        </div>
        <div className="crypto-grid">
          {cryptoDetails.map((c) => (
            <Link key={c.id} to={`/crypto/${c.id}`}>{c.h1.match(/\(([^)]+)\)/)?.[1] || c.id}</Link>
          ))}
        </div>
      </section>

      <section id="tool-blog">
        <div className="section-title-bar">
          <h2><i className="fa-regular fa-newspaper" /> المدونة والمقالات</h2>
        </div>
        <Link to="/blog" className="live-cta" style={{ textDecoration: 'none' }}>
          <p>كل مقالات ذهبي عن الذهب والفضة والاستثمار</p>
          <span className="btn">تصفّح المدونة</span>
        </Link>
      </section>

      <section>
        <div className="section-title-bar">
          <h2><i className="fa-regular fa-envelope" /> اتصل بنا</h2>
        </div>
        <p>نحن هنا لمساعدتك — للاستفسارات والاقتراحات والدعم الفني:</p>
        <p><a href="mailto:gyousef707@gmail.com">gyousef707@gmail.com</a></p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          تطبيق ذهبي - وجهتك الاولى لمتابعة اسعار الذهب والفضة والعملات في مصر. الاصدار 2.0.
        </p>
      </section>
    </div>
  );
}

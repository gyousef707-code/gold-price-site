import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@/lib/router-compat.jsx';
import FaIcon from './FaIcon.jsx';
import useCountryCode, { cpath } from '../hooks/useCountry.js';
import { COUNTRY_NAMES } from '../data/countryCodes.js';

// توحيد الحروف العربية عشان البحث يلقط "ذهب" و"ذهبٌ" و"الذهب" بنفس الطريقة
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();

function SearchBox({ onClose, country }) {
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let alive = true;
    import('../data/blog.js').then((m) => alive && setPosts(m.blogPosts || [])).catch(() => {});
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const items = useMemo(() => {
    const pages = [
      ['سعر الذهب اليوم', '/', 'ذهب عيار 21 24 18 جرام جنيه'],
      ['الجنيه الذهب', '/gold/pound', 'جنيه ذهب سبيكة'],
      ['سعر الفضة', '/silver', 'فضه عيار 999 925'],
      ['أسعار العملات', '/currencies', 'دولار يورو ريال دينار صرف'],
      ['العملات الرقمية', '/crypto', 'بيتكوين كريبتو'],
      ['الأدوات والحاسبات', '/tools', 'حاسبة ذهب زكاة مصنعية'],
      ['تنبيهات الأسعار', '/alerts', 'اشعارات تنبيه'],
      ['المدونة', '/blog', 'مقالات'],
    ].map(([title, to, kw]) => ({ title, to: cpath(country, to), kw }));
    const countries = Object.entries(COUNTRY_NAMES || {}).map(([code, name]) => ({
      title: `الذهب في ${name}`,
      to: `/${code}`,
      kw: name,
    }));
    const blog = posts.map((p) => ({ title: p.title, to: `/blog/${p.slug}`, kw: p.description, sub: 'مقال' }));
    return [...pages, ...countries, ...blog];
  }, [country, posts]);

  const term = norm(q);
  const results = term
    ? items.filter((i) => norm(`${i.title} ${i.kw || ''}`).includes(term)).slice(0, 8)
    : items.slice(0, 8);

  return (
    <div className="qs-backdrop" onClick={onClose}>
      <div className="qs-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="بحث">
        <input
          className="qs-input"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث: ذهب، فضة، دولار، زكاة، دولة…"
        />
        <div className="qs-list">
          {results.length === 0 && <div className="qs-empty">مفيش نتيجة، جرّب كلمة تانية</div>}
          {results.map((r) => (
            <Link key={r.to + r.title} to={r.to} className="qs-item" onClick={onClose}>
              {r.title}
              {r.sub && <small>{r.sub}</small>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuickMenu({ hidden }) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const country = useCountryCode();
  const navigate = useNavigate();

  if (hidden) return null;

  const goCalc = () => {
    setOpen(false);
    const el = document.getElementById('tool-gold-calc') || document.getElementById('tool-gold-calc-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else navigate({ to: cpath(country, '/tools') });
  };

  return (
    <>
      <div className={`qm${open ? ' open' : ''}`}>
        <button type="button" className="qm-btn qm-toggle" aria-label="قايمة سريعة" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <FaIcon icon="fa-solid fa-chevron-down" />
        </button>
        <div className="qm-items">
          <button type="button" className="qm-btn" aria-label="بحث" onClick={() => { setOpen(false); setSearching(true); }}>
            <FaIcon icon="fa-solid fa-magnifying-glass" />
          </button>
          <button type="button" className="qm-btn" aria-label="حاسبة الذهب" onClick={goCalc}>
            <FaIcon icon="fa-solid fa-calculator" />
          </button>
          <Link to={cpath(country, '/alerts')} className="qm-btn" aria-label="تنبيهات الأسعار" onClick={() => setOpen(false)}>
            <FaIcon icon="fa-regular fa-bell" />
          </Link>
          <a className="qm-btn" href="https://t.me/zahaby1" target="_blank" rel="noopener noreferrer" aria-label="تيليجرام" onClick={() => setOpen(false)}>
            <FaIcon icon="fa-brands fa-telegram" />
          </a>
        </div>
      </div>
      {searching && <SearchBox country={country} onClose={() => setSearching(false)} />}
    </>
  );
}

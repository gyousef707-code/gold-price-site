import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/lib/router-compat.jsx';
import useBackClose from '../hooks/useBackClose.js';
import { COUNTRIES, COUNTRY_ORDER, flagUrl } from '../data/countries.js';

function accentOf(c) {
  return c.isHome ? { a: '#e3b341', rgb: '227, 179, 65' } : { a: c.theme?.dark?.accent, rgb: c.theme?.dark?.rgb };
}

// شاشة اختيار الدولة (بتفتح من العلم في الهيدر). بتتحمّل بس لما المستخدم يفتحها.
export default function CountryPicker({ open, current, onClose }) {
  const closeRef = useRef(null);

  useBackClose(open, () => {
    onClose();
    return false;
  });

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  // بنرسمها خارج الهيدر (على body) عشان تغطي الشاشة كلها مهما كان تنسيق الهيدر
  return createPortal(
    <>
      <div className="cpk-overlay" onClick={onClose} />
      <div className="cpk-sheet" role="dialog" aria-modal="true" aria-label="اختيار الدولة">
        <div className="cpk-grab" aria-hidden="true" />
        <header className="cpk-head">
          <div>
            <h2>اختر دولتك</h2>
            <p>أسعار الذهب والفضة بعملة كل دولة</p>
          </div>
          <button ref={closeRef} className="cpk-close" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </header>
        <ul className="cpk-grid">
          {COUNTRY_ORDER.map((code) => {
            const c = COUNTRIES[code];
            const { a, rgb } = accentOf(c);
            const style = a ? { '--c': a, '--c-rgb': rgb } : undefined;
            const inner = (
              <>
                <span className="cpk-flag">
                  <img src={flagUrl(c.flag, 80)} width="52" height="52" alt="" loading="lazy" />
                </span>
                <span className="cpk-name">{c.name}</span>
                <span className="cpk-cur">{c.currencyName}</span>
                {code === current ? <span className="cpk-badge here">أنت هنا</span> : null}
                {!c.active ? <span className="cpk-badge soon">قريبًا</span> : null}
              </>
            );
            return (
              <li key={code}>
                {c.active ? (
                  <Link
                    to={c.isHome ? '/' : c.path}
                    className={`cpk-card${code === current ? ' current' : ''}`}
                    style={style}
                    onClick={onClose}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="cpk-card disabled" aria-disabled="true">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>,
    document.body
  );
}

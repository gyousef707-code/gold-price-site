import { lazy, Suspense, useCallback, useState } from 'react';
import { Link, useLocation } from '@/lib/router-compat.jsx';
import FaIcon from './FaIcon.jsx';
import { COUNTRY_CODES, COUNTRY_NAMES } from '../data/countryCodes.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { SunIcon, MoonIcon, AutoIcon } from './icons.jsx';

const NEXT_MODE = { dark: 'light', light: 'auto', auto: 'dark' };

// شاشة اختيار الدولة بتتحمّل بس لما المستخدم يضغط على العلم
const CountryPicker = lazy(() => import('./CountryPicker.jsx'));

// علم مصر مرسوم داخل الصفحة (بدون طلب خارجي) لأنه الافتراضي لأغلب الزوار
function EgyptFlag() {
  return (
    <svg className="flag-btn-img" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <defs>
        <clipPath id="eg-flag-clip">
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath="url(#eg-flag-clip)">
        <rect width="24" height="8" fill="#ce1126" />
        <rect y="8" width="24" height="8" fill="#fff" />
        <rect y="16" width="24" height="8" fill="#000" />
        <circle cx="12" cy="12" r="2.4" fill="#c09300" />
      </g>
    </svg>
  );
}

function ModeIcon({ mode }) {
  if (mode === 'light') return <SunIcon size={19} />;
  if (mode === 'auto') return <AutoIcon size={18} />;
  return <MoonIcon size={18} />;
}

export default function Header({ onMenuClick }) {
  const { mode, setMode } = useTheme();
  const { t } = useLang();

  const { pathname } = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const closePicker = useCallback(() => setPickerOpen(false), []);
  const seg = pathname.split('/')[1];
  const current = COUNTRY_CODES.includes(seg) ? seg : 'eg';
  const inCountry = current !== 'eg';

  const cycleTheme = () => setMode(NEXT_MODE[mode] || 'dark');

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="icon-btn" onClick={cycleTheme} aria-label={t('header.theme')}>
          <ModeIcon mode={mode} />
        </button>
        <button
          className="icon-btn flag-btn"
          onClick={() => setPickerOpen(true)}
          aria-label="اختيار الدولة"
          aria-haspopup="dialog"
        >
          {current === 'eg' ? (
            <EgyptFlag />
          ) : (
            <img
              className="flag-btn-img"
              src={`https://flagcdn.com/w80/${current}.png`}
              width="26"
              height="26"
              alt=""
            />
          )}
        </button>
      </div>
      <div className="header-right">
        <Link to={inCountry ? `/${current}` : '/'} className="logo-link">
          <h1 className="logo-text">
            {t('app.name')} <span className="logo-dot">●</span>
            {inCountry ? <span className="logo-country">{COUNTRY_NAMES[current]}</span> : null}
          </h1>
        </Link>
        <button className="icon-btn" onClick={onMenuClick} aria-label={t('header.menu')}>
          <FaIcon icon="fa-solid fa-bars" />
        </button>
      </div>
      {pickerOpen ? (
        <Suspense fallback={null}>
          <CountryPicker open={pickerOpen} current={current} onClose={closePicker} />
        </Suspense>
      ) : null}
    </header>
  );
}

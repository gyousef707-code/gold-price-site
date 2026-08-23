import { Link } from '@/lib/router-compat.jsx';
import FaIcon from './FaIcon.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { SunIcon, MoonIcon, AutoIcon } from './icons.jsx';

const NEXT_MODE = { dark: 'light', light: 'auto', auto: 'dark' };

function ModeIcon({ mode }) {
  if (mode === 'light') return <SunIcon size={19} />;
  if (mode === 'auto') return <AutoIcon size={18} />;
  return <MoonIcon size={18} />;
}

export default function Header({ onMenuClick }) {
  const { mode, setMode } = useTheme();
  const { t } = useLang();

  const cycleTheme = () => setMode(NEXT_MODE[mode] || 'dark');
  const refresh = () => window.location.reload();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="icon-btn" onClick={cycleTheme} aria-label={t('header.theme')}>
          <ModeIcon mode={mode} />
        </button>
        <button className="icon-btn" onClick={refresh} aria-label={t('header.refresh')}>
          <FaIcon icon="fa-solid fa-rotate" />
        </button>
      </div>
      <div className="header-right">
        <Link to="/" className="logo-link">
          <h1 className="logo-text">
            {t('app.name')} <span className="logo-dot">●</span>
          </h1>
        </Link>
        <button className="icon-btn" onClick={onMenuClick} aria-label={t('header.menu')}>
          <FaIcon icon="fa-solid fa-bars" />
        </button>
      </div>
    </header>
  );
}

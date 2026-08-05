import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

const NEXT_MODE = { dark: 'light', light: 'auto', auto: 'dark' };
const MODE_ICON = { dark: 'fa-moon', light: 'fa-sun', auto: 'fa-circle-half-stroke' };

export default function Header({ onMenuClick }) {
  const { mode, setMode } = useTheme();

  const cycleTheme = () => setMode(NEXT_MODE[mode] || 'dark');

  const refresh = () => window.location.reload();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="icon-btn" onClick={cycleTheme} aria-label="تبديل الوضع">
          <i className={`fa-solid ${MODE_ICON[mode] || 'fa-moon'}`} />
        </button>
        <button className="icon-btn" onClick={refresh} aria-label="تحديث">
          <i className="fa-solid fa-rotate" />
        </button>
      </div>
      <div className="header-right">
        <Link to="/" className="logo-link">
          <h1 className="logo-text">
            ذهبي <span className="logo-dot">●</span>
          </h1>
        </Link>
        <button className="icon-btn" onClick={onMenuClick} aria-label="القائمة">
          <i className="fa-solid fa-bars" />
        </button>
      </div>
    </header>
  );
}

import { Link } from 'react-router-dom';

export default function Header({ onMenuClick }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="logo-link">
          <span className="logo-text">ذهبي</span>
        </Link>
      </div>
      <div className="header-right">
        <button className="icon-btn" onClick={onMenuClick} aria-label="القائمة">
          <i className="fa-solid fa-bars" />
        </button>
      </div>
    </header>
  );
}

import { NavLink } from '@/lib/router-compat.jsx';
import { useLang } from '../context/LangContext.jsx';
import FaIcon from './FaIcon.jsx';

const TABS = [
  { to: '/', icon: 'fa-solid fa-chart-line', key: 'nav.prices', end: true },
  { to: '/currencies', icon: 'fa-solid fa-money-bill-transfer', key: 'nav.currencies' },
  { to: '/silver', icon: 'fa-solid fa-gem', key: 'nav.silver' },
  { to: '/crypto', icon: 'fa-solid fa-coins', key: 'nav.crypto' },
  { to: '/tools', icon: 'fa-solid fa-toolbox', key: 'nav.tools' },
];

export default function BottomNav() {
  const { t } = useLang();
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FaIcon icon={tab.icon} />
          <span>{t(tab.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

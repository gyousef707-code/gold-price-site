import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', icon: 'fa-solid fa-coins', label: 'ذهب', end: true },
  { to: '/currencies', icon: 'fa-solid fa-money-bill-transfer', label: 'عملات' },
  { to: '/silver', icon: 'fa-solid fa-circle-dollar-to-slot', label: 'فضة' },
  { to: '/crypto', icon: 'fa-brands fa-bitcoin', label: 'رقمية' },
  { to: '/tools', icon: 'fa-solid fa-toolbox', label: 'أدوات' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <i className={tab.icon} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

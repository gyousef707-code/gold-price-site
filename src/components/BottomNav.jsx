import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', icon: 'fa-solid fa-chart-line', label: 'الاسعار', end: true },
  { to: '/currencies', icon: 'fa-solid fa-money-bill-transfer', label: 'العملات' },
  { to: '/silver', icon: 'fa-solid fa-gem', label: 'الفضة' },
  { to: '/crypto', icon: 'fa-solid fa-coins', label: 'رقمية' },
  { to: '/tools', icon: 'fa-solid fa-toolbox', label: 'الادوات' },
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

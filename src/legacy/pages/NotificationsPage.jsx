import { Link } from '@/lib/router-compat.jsx';
import { useLang } from '../context/LangContext.jsx';
import useNotifications, { absoluteTime, relativeTime } from '../hooks/useNotifications.js';
import FaIcon from '../components/FaIcon.jsx';

const ICONS = {
  gold: 'fa-solid fa-coins',
  ounce: 'fa-solid fa-chart-line',
  usd: 'fa-solid fa-money-bill-transfer',
  crypto: 'fa-brands fa-bitcoin',
};

export default function NotificationsPage() {
  const { t, lang } = useLang();
  const { items, clear } = useNotifications();

  return (
    <div className="page-wrap">
      <div className="breadcrumb">
        <Link to="/">{lang === 'en' ? 'Home' : 'الرئيسية'}</Link> / {t('notifications.title')}
      </div>

      <div className="notif-head">
        <h1>{t('notifications.title')}</h1>
        {items.length > 0 && (
          <button type="button" className="notif-clear" onClick={clear}>
            <FaIcon icon="fa-regular fa-trash-can" /> {lang === 'en' ? 'Clear' : 'مسح الكل'}
          </button>
        )}
      </div>

      {!items.length && (
        <div className="notif-empty">
          <FaIcon icon="fa-regular fa-bell" />
          <p>{lang === 'en' ? 'No notifications yet — we will alert you when prices move.' : 'مفيش إشعارات لسه — هنبلغك أول ما الأسعار تتحرك.'}</p>
        </div>
      )}

      <div className="notif-list">
        {items.map((n) => (
          <div key={n.id} className="notification-item">
            <div className={`notification-icon type-${n.type}`}>
              <FaIcon icon={ICONS[n.type] || 'fa-regular fa-bell'} />
            </div>
            <div className="notification-body">
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <span className="notification-time">
                <FaIcon icon="fa-regular fa-clock" /> {relativeTime(n.at, lang)} • {absoluteTime(n.at, lang)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

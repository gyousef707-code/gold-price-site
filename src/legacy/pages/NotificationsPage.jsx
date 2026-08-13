import { useState } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import { useLang } from '../context/LangContext.jsx';
import useNotifications, { absoluteTime, relativeTime, subscribeToPush } from '../hooks/useNotifications.js';

const ICONS = {
  gold: 'fa-solid fa-coins',
  ounce: 'fa-solid fa-chart-line',
  usd: 'fa-solid fa-money-bill-transfer',
  crypto: 'fa-brands fa-bitcoin',
};

export default function NotificationsPage() {
  const { t, lang } = useLang();
  const { items, clear } = useNotifications();
  const [pushStatus, setPushStatus] = useState(null); // null | 'loading' | { ok, reason }

  const handleEnablePush = async () => {
    setPushStatus('loading');
    const result = await subscribeToPush();
    setPushStatus(result);
  };

  return (
    <div className="page-wrap">
      <div className="breadcrumb">
        <Link to="/">{lang === 'en' ? 'Home' : 'الرئيسية'}</Link> / {t('notifications.title')}
      </div>

      <div className="notif-head">
        <h1>{t('notifications.title')}</h1>
        {items.length > 0 && (
          <button type="button" className="notif-clear" onClick={clear}>
            <i className="fa-regular fa-trash-can" /> {lang === 'en' ? 'Clear' : 'مسح الكل'}
          </button>
        )}
      </div>

      <div style={{ margin: '12px 0', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border-gold, #444)' }}>
        <button
          type="button"
          onClick={handleEnablePush}
          disabled={pushStatus === 'loading'}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            background: 'var(--gold-primary, #d4af37)',
            color: '#161b22',
          }}
        >
          <i className="fa-solid fa-bell" />{' '}
          {pushStatus === 'loading'
            ? (lang === 'en' ? 'Enabling…' : 'جاري التفعيل…')
            : (lang === 'en' ? 'Enable push notifications' : 'فعّل إشعارات الجهاز ده')}
        </button>

        {pushStatus && pushStatus !== 'loading' && (
          <p style={{ marginTop: 10, fontWeight: 600, color: pushStatus.ok ? '#3fb950' : '#f85149' }}>
            {pushStatus.ok
              ? (lang === 'en' ? '✅ Enabled successfully on this device.' : '✅ اتفعّلت بنجاح على الجهاز ده.')
              : `❌ ${pushStatus.reason}`}
          </p>
        )}
      </div>

      {!items.length && (
        <div className="notif-empty">
          <i className="fa-regular fa-bell" />
          <p>{lang === 'en' ? 'No notifications yet — we will alert you when prices move.' : 'مفيش إشعارات لسه — هنبلغك أول ما الأسعار تتحرك.'}</p>
        </div>
      )}

      <div className="notif-list">
        {items.map((n) => (
          <div key={n.id} className="notification-item">
            <div className={`notification-icon type-${n.type}`}>
              <i className={ICONS[n.type] || 'fa-regular fa-bell'} />
            </div>
            <div className="notification-body">
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <span className="notification-time">
                <i className="fa-regular fa-clock" /> {relativeTime(n.at, lang)} • {absoluteTime(n.at, lang)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Link } from '@/lib/router-compat.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { SunIcon, MoonIcon, AutoIcon } from './icons.jsx';
import RatingStars from './RatingStars.jsx';
import useNotifications, { relativeTime } from '../hooks/useNotifications.js';
import { shareCard } from '../lib/shareCard.js';

export default function Drawer({ open, onClose, panel, setPanel }) {
  const { mode, setMode } = useTheme();
  const { t, lang, setLang } = useLang();
  const { items } = useNotifications();

  const THEME_OPTIONS = [
    { id: 'light', label: t('theme.light'), Icon: SunIcon },
    { id: 'dark', label: t('theme.dark'), Icon: MoonIcon },
    { id: 'auto', label: t('theme.auto'), Icon: AutoIcon },
  ];

  const shareApp = () =>
    shareCard(
      {
        title: lang === 'en' ? 'Zahaby — live prices app' : 'تطبيق ذهبي — الأسعار لحظة بلحظة',
        subtitle: lang === 'en' ? 'Gold • Silver • Currencies • Crypto' : 'ذهب • فضة • عملات • رقمية',
        rows: [
          { label: lang === 'en' ? 'Gold' : 'الذهب', value: lang === 'en' ? 'All karats live' : 'كل العيارات لحظيًا' },
          { label: lang === 'en' ? 'Silver' : 'الفضة', value: lang === 'en' ? 'All purities' : 'كل العيارات' },
          { label: lang === 'en' ? 'Currencies' : 'العملات', value: lang === 'en' ? 'Live converter' : 'محول لحظي' },
          { label: lang === 'en' ? 'Crypto' : 'العملات الرقمية', value: 'Top 20' },
        ],
        footer: lang === 'en' ? 'Free • No ads clutter • Updated automatically' : 'مجاني • بيتحدث تلقائيًا',
      },
      lang === 'en'
        ? 'Zahaby — follow gold, silver and currency prices live'
        : 'تطبيق ذهبي — تابع أسعار الذهب والفضة والعملات لحظة بلحظة'
    );

  return (
    <>
      <div className={`drawer-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'active' : ''}`}>
        <div className="drawer-header">
          <h2>{t('app.name')}</h2>
          <button className="drawer-close" onClick={onClose} aria-label="إغلاق">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="drawer-body">
          <button
            className="drawer-item"
            onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')}
          >
            <i className="fa-regular fa-bell" /> {t('drawer.notifications')}
            {items.length > 0 && <span className="drawer-badge">{items.length}</span>}
          </button>
          {panel === 'notifications' && (
            <div className="drawer-panel">
              {items.slice(0, 3).map((n) => (
                <div key={n.id} className="drawer-notif">
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                  <span className="news-source">{relativeTime(n.at, lang)}</span>
                </div>
              ))}
              {!items.length && (
                <p className="drawer-panel-empty">
                  {lang === 'en' ? 'No notifications yet' : 'مفيش إشعارات لسه'}
                </p>
              )}
              <Link to="/notifications" className="drawer-panel-link" onClick={onClose}>
                {t('drawer.allNotifications')} <i className="fa-solid fa-chevron-left" />
              </Link>
            </div>
          )}

          <button className="drawer-item" onClick={() => setPanel(panel === 'settings' ? null : 'settings')}>
            <i className="fa-solid fa-gear" /> {t('drawer.settings')}
          </button>
          {panel === 'settings' && (
            <div className="drawer-panel">
              <p className="drawer-panel-title">{t('settings.appearance')}</p>
              <div className="theme-options">
                {THEME_OPTIONS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    className={`theme-option ${mode === id ? 'active' : ''}`}
                    onClick={() => setMode(id)}
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <p className="drawer-panel-title" style={{ marginTop: 14 }}>{t('settings.language')}</p>
              <div className="theme-options lang-options">
                <button className={`theme-option ${lang === 'ar' ? 'active' : ''}`} onClick={() => setLang('ar')}>
                  <span className="lang-code">AR</span>
                  <span>العربية</span>
                </button>
                <button className={`theme-option ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
                  <span className="lang-code">EN</span>
                  <span>English</span>
                </button>
              </div>
            </div>
          )}

          <button className="drawer-item" onClick={shareApp}>
            <i className="fa-solid fa-share-nodes" /> {t('drawer.share')}
          </button>

          <div className="drawer-rating">
            <RatingStars compact />
          </div>

          <a
            href="https://t.me/zahaby1"
            target="_blank"
            rel="noopener noreferrer"
            className="drawer-item"
            onClick={onClose}
          >
            <i className="fa-brands fa-telegram" /> {t('drawer.telegram')}
          </a>
          <Link to="/contact" className="drawer-item" onClick={onClose}>
            <i className="fa-regular fa-envelope" /> {t('drawer.contact')}
          </Link>
          <Link to="/about" className="drawer-item" onClick={onClose}>
            <i className="fa-regular fa-circle-question" /> {t('drawer.about')}
          </Link>
          <Link to="/privacy" className="drawer-item" onClick={onClose}>
            <i className="fa-solid fa-shield-halved" /> {t('drawer.privacy')}
          </Link>
          <Link to="/terms" className="drawer-item" onClick={onClose}>
            <i className="fa-solid fa-file-contract" /> {t('drawer.terms')}
          </Link>
          <Link to="/disclaimer" className="drawer-item" onClick={onClose}>
            <i className="fa-solid fa-triangle-exclamation" /> {t('drawer.disclaimer')}
          </Link>
        </div>
      </aside>
    </>
  );
}

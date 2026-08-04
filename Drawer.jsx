import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

const THEME_OPTIONS = [
  { id: 'light', label: 'فاتح' },
  { id: 'dark', label: 'داكن' },
  { id: 'auto', label: 'تلقائي' },
];

export default function Drawer({ open, onClose, panel, setPanel }) {
  const { mode, setMode } = useTheme();

  const shareApp = async () => {
    const shareData = { title: 'ذهبي', text: 'تابع أسعار الذهب والفضة والعملات لحظة بلحظة', url: window.location.origin };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (_) { /* تجاهل الإلغاء */ }
    } else {
      await navigator.clipboard?.writeText(shareData.url);
      alert('تم نسخ رابط الموقع');
    }
  };

  return (
    <>
      <div className={`drawer-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span className="logo-text">ذهبي</span>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <button className="drawer-item" onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')}>
          <i className="fa-regular fa-bell" /> الإشعارات
        </button>
        {panel === 'notifications' && (
          <div style={{ padding: '8px 10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
            <div className="news-item">
              <h3 style={{ color: 'var(--text-color)', fontSize: 13.5 }}>انخفاض سعر الأونصة</h3>
              <span className="news-source">منذ 10 دقائق</span>
            </div>
            <div className="news-item">
              <h3 style={{ color: 'var(--text-color)', fontSize: 13.5 }}>تغيّر سعر عيار 21</h3>
              <span className="news-source">منذ ساعة</span>
            </div>
          </div>
        )}

        <button className="drawer-item" onClick={() => setPanel(panel === 'settings' ? null : 'settings')}>
          <i className="fa-solid fa-gear" /> الإعدادات
        </button>
        {panel === 'settings' && (
          <div style={{ padding: '4px 10px 14px' }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>مظهر التطبيق</p>
            <div className="theme-options">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  className={`theme-mode-btn ${mode === t.id ? 'active' : ''}`}
                  onClick={() => setMode(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="drawer-item" onClick={shareApp}>
          <i className="fa-solid fa-share-nodes" /> مشاركة التطبيق
        </button>
        <Link to="/contact" className="drawer-item" onClick={onClose}>
          <i className="fa-regular fa-envelope" /> اتصل بنا
        </Link>
        <Link to="/about" className="drawer-item" onClick={onClose}>
          <i className="fa-regular fa-circle-question" /> من نحن
        </Link>
        <Link to="/privacy" className="drawer-item" onClick={onClose}>
          <i className="fa-solid fa-shield-halved" /> سياسة الخصوصية
        </Link>
        <Link to="/terms" className="drawer-item" onClick={onClose}>
          <i className="fa-solid fa-file-contract" /> شروط الاستخدام
        </Link>
        <Link to="/disclaimer" className="drawer-item" onClick={onClose}>
          <i className="fa-solid fa-triangle-exclamation" /> إخلاء المسؤولية
        </Link>
      </aside>
    </>
  );
}

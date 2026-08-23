import { Link } from '@/lib/router-compat.jsx';
import { useLang } from '../context/LangContext.jsx';

export default function Footer() {
  const { t, lang } = useLang();
  return (
    <footer className="site-footer">
      <p>© 2026 {t('app.name')}. {lang === 'en' ? 'All rights reserved.' : 'جميع الحقوق محفوظة.'}</p>
      <div className="foot-links">
        <a href="https://t.me/zahaby1" target="_blank" rel="noopener noreferrer">
          {t('drawer.telegram')}
        </a>
        <Link to="/about">{t('drawer.about')}</Link>
        <Link to="/contact">{t('drawer.contact')}</Link>
        <Link to="/terms">{t('drawer.terms')}</Link>
        <Link to="/privacy">{t('drawer.privacy')}</Link>
        <Link to="/disclaimer">{t('drawer.disclaimer')}</Link>
      </div>
    </footer>
  );
}

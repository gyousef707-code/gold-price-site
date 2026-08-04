import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <p>© 2026 ذهبي. جميع الحقوق محفوظة.</p>
      <div className="foot-links">
        <Link to="/about">من نحن</Link>
        <Link to="/contact">اتصل بنا</Link>
        <Link to="/terms">شروط الاستخدام</Link>
        <Link to="/privacy">سياسة الخصوصية</Link>
        <Link to="/disclaimer">إخلاء المسؤولية</Link>
      </div>
    </footer>
  );
}

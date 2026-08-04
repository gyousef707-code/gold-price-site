import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

export default function NotFoundPage() {
  return (
    <div className="page-wrap" style={{ textAlign: 'center', paddingTop: 60 }}>
      <Seo title="الصفحة غير موجودة | ذهبي" description="الصفحة اللي بتدور عليها مش موجودة." path="/404" />
      <h1 style={{ fontSize: 60, color: 'var(--gold-primary)', marginBottom: 10 }}>404</h1>
      <p style={{ marginBottom: 20 }}>الصفحة اللي بتدور عليها مش موجودة أو اتنقلت.</p>
      <Link to="/" className="live-cta btn" style={{ display: 'inline-block' }}>الرجوع للصفحة الرئيسية</Link>
    </div>
  );
}

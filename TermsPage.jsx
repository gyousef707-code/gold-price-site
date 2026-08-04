import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { staticPages } from '../data/staticPages.js';

const p = staticPages.terms;

export default function TermsPage() {
  return (
    <div className="page-wrap">
      <Seo title={p.title} description={p.description} path="/terms" />
      <div className="breadcrumb"><Link to="/">الرئيسية</Link> / شروط الاستخدام</div>
      <h1>{p.h1 || 'شروط الاستخدام'}</h1>
      <div dangerouslySetInnerHTML={{ __html: p.body_html }} />
    </div>
  );
}

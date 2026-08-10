import { Link } from '@/lib/router-compat.jsx';
import Seo from '../components/Seo.jsx';
import { staticPages } from '../data/staticPages.js';

const p = staticPages.privacy;

export default function PrivacyPage() {
  return (
    <div className="page-wrap">
      <Seo title={p.title} description={p.description} path="/privacy" />
      <div className="breadcrumb"><Link to="/">الرئيسية</Link> / سياسة الخصوصية</div>
      <h1>{p.h1 || 'سياسة الخصوصية'}</h1>
      <div dangerouslySetInnerHTML={{ __html: p.body_html }} />
    </div>
  );
}

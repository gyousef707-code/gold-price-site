import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { staticPages } from '../data/staticPages.js';

const p = staticPages.contact;

export default function ContactPage() {
  return (
    <div className="page-wrap">
      <Seo title={p.title} description={p.description} path="/contact" />
      <div className="breadcrumb"><Link to="/">الرئيسية</Link> / اتصل بنا</div>
      <h1>{p.h1}</h1>
      <div dangerouslySetInnerHTML={{ __html: p.body_html }} />
    </div>
  );
}

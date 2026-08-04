import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { staticPages } from '../data/staticPages.js';

const p = staticPages.about;

export default function AboutPage() {
  return (
    <div className="page-wrap">
      <Seo title={p.title} description={p.description} path="/about" />
      <div className="breadcrumb"><Link to="/">الرئيسية</Link> / من نحن</div>
      <h1>{p.h1}</h1>
      <div dangerouslySetInnerHTML={{ __html: p.body_html }} />
    </div>
  );
}

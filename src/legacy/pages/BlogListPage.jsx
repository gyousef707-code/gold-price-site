import { Link } from '@/lib/router-compat.jsx';
import Seo from '../components/Seo.jsx';
import { blogPosts } from '../data/blog.js';

export default function BlogListPage() {
  return (
    <div className="page-wrap">
      <Seo
        title="مدونة ذهبي | مقالات عن الذهب والاستثمار"
        description="مقالات ذهبي: كل ما تحتاج معرفته عن اسعار الذهب، الفضة، الزكاة، والاستثمار في مصر."
        keywords="مقالات عن الذهب, مدونة ذهبي"
        path="/blog"
      />

      <h1>المدونة والمقالات</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 18 }}>
        كل مقالات ذهبي عن أسعار الذهب والفضة والاستثمار في مصر
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {blogPosts.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="related-article-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 16 }}>
            <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>{p.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{p.description}</p>
            {p.date && <span className="news-source" style={{ marginTop: 8 }}>{new Date(p.date).toLocaleDateString('ar-EG')}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

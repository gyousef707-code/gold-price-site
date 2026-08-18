import { Link } from '@/lib/router-compat.jsx';
import { blogPosts } from '../data/blog.js';
import { useLang } from '../context/LangContext.jsx';
import FaIcon from './FaIcon.jsx';

export default function RelatedArticles({ slugs, count = 3 }) {
  const { t } = useLang();
  const posts = slugs
    ? slugs.map((s) => blogPosts.find((p) => p.slug === s)).filter(Boolean)
    : blogPosts.slice(0, count);

  if (!posts.length) return null;

  return (
    <section>
      <div className="section-title-bar">
        <h2><FaIcon icon="fa-regular fa-newspaper" /> {t('articles.related')}</h2>
      </div>
      <div className="related-articles">
        {posts.slice(0, count).map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="related-article-card">
            <h3>{p.title}</h3>
            <FaIcon icon="fa-solid fa-chevron-left" />
          </Link>
        ))}
      </div>
    </section>
  );
}

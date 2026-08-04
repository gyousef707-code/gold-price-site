import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blog.js';

export default function RelatedArticles({ slugs, count = 3 }) {
  const posts = slugs
    ? slugs.map((s) => blogPosts.find((p) => p.slug === s)).filter(Boolean)
    : blogPosts.slice(0, count);

  if (!posts.length) return null;

  return (
    <section>
      <div className="section-title-bar">
        <h2><i className="fa-regular fa-newspaper" /> مقالات ذات صلة</h2>
      </div>
      <div className="related-articles">
        {posts.slice(0, count).map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="related-article-card">
            <h3>{p.title}</h3>
            <i className="fa-solid fa-chevron-left" />
          </Link>
        ))}
      </div>
    </section>
  );
}

import { Link, useParams, Navigate } from '@/lib/router-compat.jsx';
import FaIcon from '../components/FaIcon.jsx';
import Seo from '../components/Seo.jsx';
import JsonLd from '../components/JsonLd.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import AdSlot from '../components/AdSlot.jsx';
import { blogPosts } from '../data/blog.js';
import { breadcrumbJsonLd, articleJsonLd } from '@/lib/jsonld.js';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  const related = blogPosts.filter((p) => p.slug !== slug).slice(0, 3).map((p) => p.slug);

  const share = async () => {
    const url = `${window.location.origin}/blog/${slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); } catch (_) {}
    } else {
      await navigator.clipboard?.writeText(url);
      alert('تم نسخ رابط المقال');
    }
  };

  return (
    <div className="page-wrap">
      <Seo title={post.title} description={post.description} path={`/blog/${slug}`} type="article" />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'الرئيسية', path: '/' },
            { name: 'المدونة', path: '/blog' },
            { name: post.title, path: `/blog/${slug}` },
          ]),
          articleJsonLd({
            title: post.title,
            description: post.description,
            path: `/blog/${slug}`,
            datePublished: post.date,
          }),
        ]}
      />

      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link> / <Link to="/blog">المدونة</Link>
      </div>
      <span className="eyebrow">مقال</span>
      <h1>{post.h1}</h1>
      {post.date && <p className="article-date">{new Date(post.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}

      <AdSlot id={`blog-${slug}-top`} />

      <div dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

      <AdSlot id={`blog-${slug}-bottom`} />

      <button type="button" className="share-btn" onClick={share}>
        <FaIcon icon="fa-solid fa-share-nodes" /> شارك المقال
      </button>

      <RelatedArticles slugs={related} />
    </div>
  );
}

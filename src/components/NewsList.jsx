import useApiData from '../hooks/useApiData.js';

export default function NewsList() {
  const { data, loading, error } = useApiData('/api/news', { intervalMs: 5 * 60 * 1000 });

  return (
    <section>
      <div className="section-title-bar">
        <h2><i className="fa-regular fa-newspaper" /> أحدث الأخبار</h2>
      </div>
      {loading && <p className="loading-text">جارِ تحميل الأخبار...</p>}
      {error && !loading && <p className="error-text">تعذر تحميل الأخبار حاليًا</p>}
      {data?.articles?.slice(0, 6).map((a, i) => (
        <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="news-item" style={{ display: 'block' }}>
          <h3>{a.title}</h3>
          <span className="news-source">{a.source}</span>
        </a>
      ))}
    </section>
  );
}

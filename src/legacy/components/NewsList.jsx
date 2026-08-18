import useApiData from '../hooks/useApiData.js';
import FaIcon from './FaIcon.jsx';
import { useLang } from '../context/LangContext.jsx';

export default function NewsList() {
  const { data, loading, error } = useApiData('/api/public/news', { intervalMs: 5 * 60 * 1000 });
  const { t, lang } = useLang();

  return (
    <section>
      <div className="section-title-bar">
        <h2><FaIcon icon="fa-regular fa-newspaper" /> {t('news.latest')}</h2>
      </div>
      {loading && <p className="loading-text">{lang === 'en' ? 'Loading news...' : 'جارِ تحميل الأخبار...'}</p>}
      {error && !loading && <p className="error-text">{t('error')}</p>}
      {data?.articles?.slice(0, 6).map((a, i) => (
        <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="news-item" style={{ display: 'block' }}>
          <h3>{a.title}</h3>
          <span className="news-source">{a.source}</span>
        </a>
      ))}
    </section>
  );
}

import JsonLd from './JsonLd.jsx';
import { useLang } from '../context/LangContext.jsx';
import { faqJsonLd } from '@/lib/jsonld.js';

// قسم أسئلة شائعة قابل لإعادة الاستخدام: بيعرض الأسئلة في الصفحة وبيطلّع
// FAQPage schema لجوجل من نفس الأسئلة (لازم الاتنين يطابقوا بعض).
// items: [[سؤال, إجابة], ...] — عربي بس، فبيتخفى لو الصفحة بالإنجليزي
// إلا لو alwaysShow=true (للصفحات اللي كلها عربي أصلًا).
export default function FaqSection({ id, title, items, alwaysShow = false }) {
  const { lang } = useLang();
  if (!items?.length || (lang === 'en' && !alwaysShow)) return null;
  return (
    <section className="cp-section cp-about" aria-labelledby={`${id}-h`}>
      <JsonLd data={faqJsonLd(items)} />
      <h2 id={`${id}-h`}>{title}</h2>
      <div className="cp-faq">
        {items.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

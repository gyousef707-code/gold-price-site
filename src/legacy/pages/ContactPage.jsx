import { useState } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import Seo from '../components/Seo.jsx';
import RatingStars from '../components/RatingStars.jsx';
import FaIcon from '../components/FaIcon.jsx';
import { staticPages } from '../data/staticPages.js';
import { useLang } from '../context/LangContext.jsx';

const p = staticPages.contact;
const EMAIL = 'gyousef707@gmail.com';

const FAQ = [
  {
    q: { ar: 'منين بتجيبوا الأسعار؟', en: 'Where do the prices come from?' },
    a: {
      ar: 'من مصادر السوق العالمية لسعر الأونصة (XAU/XAG) وسعر صرف الدولار، وبنحوّلهم لسعر الجرام بالجنيه لكل عيار تلقائيًا.',
      en: 'From global spot sources (XAU/XAG) plus the live USD rate, converted automatically into per-gram EGP prices for every karat.',
    },
  },
  {
    q: { ar: 'كل قد إيه بتتحدث الأسعار؟', en: 'How often do prices update?' },
    a: {
      ar: 'الذهب والفضة كل أقل من دقيقة، العملات كل دقيقتين، والعملات الرقمية كل دقيقة تقريبًا.',
      en: 'Gold and silver under a minute, currencies every two minutes, crypto roughly every minute.',
    },
  },
  {
    q: { ar: 'ليه السعر مختلف عن محل الصاغة؟', en: 'Why is the shop price different?' },
    a: {
      ar: 'سعر الصاغة بيزود عليه المصنعية وهامش الربح، فبيختلف من محل للتاني. أسعارنا إرشادية لسعر المعدن نفسه.',
      en: 'Jewellers add workmanship and margin, which differs per shop. Our prices reflect the metal itself.',
    },
  },
  {
    q: { ar: 'التطبيق مجاني؟', en: 'Is the app free?' },
    a: {
      ar: 'أيوه مجاني بالكامل ومن غير تسجيل دخول.',
      en: 'Yes, completely free with no sign-up.',
    },
  },
];

export default function ContactPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [form, setForm] = useState({ name: '', email: '', subject: 'اقتراح', message: '' });
  const [open, setOpen] = useState(0);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const body = `${en ? 'Name' : 'الاسم'}: ${form.name}\n${en ? 'Email' : 'البريد'}: ${form.email}\n\n${form.message}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`[ذهبي] ${form.subject}`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="page-wrap">
      <Seo title={p.title} description={p.description} path="/contact" />
      <div className="breadcrumb">
        <Link to="/">{en ? 'Home' : 'الرئيسية'}</Link> / {en ? 'Contact us' : 'اتصل بنا'}
      </div>

      <div className="tools-hero">
        <h1>{en ? 'Talk to us' : 'تواصل معانا'}</h1>
        <p>
          {en
            ? 'Questions, price accuracy reports, partnership or advertising requests — we read everything.'
            : 'استفسار، ملاحظة على دقة سعر، طلب إعلان أو شراكة — بنقرأ كل رسالة وبنرد في أقرب وقت.'}
        </p>
      </div>

      <div className="contact-grid">
        <form className="calc-card contact-form" onSubmit={submit}>
          <div className="calc-row">
            <div className="calc-group">
              <label>{en ? 'Your name' : 'اسمك'}</label>
              <input className="calc-input" required value={form.name} onChange={set('name')} />
            </div>
            <div className="calc-group">
              <label>{en ? 'Your email' : 'بريدك الإلكتروني'}</label>
              <input className="calc-input" type="email" required value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="calc-group">
            <label>{en ? 'Subject' : 'الموضوع'}</label>
            <select className="calc-input calc-select" value={form.subject} onChange={set('subject')}>
              <option>{en ? 'Suggestion' : 'اقتراح'}</option>
              <option>{en ? 'Price accuracy' : 'ملاحظة على سعر'}</option>
              <option>{en ? 'Advertising' : 'إعلانات وشراكات'}</option>
              <option>{en ? 'Technical issue' : 'مشكلة تقنية'}</option>
            </select>
          </div>
          <div className="calc-group">
            <label>{en ? 'Message' : 'رسالتك'}</label>
            <textarea className="calc-input contact-textarea" rows={5} required value={form.message} onChange={set('message')} />
          </div>
          <button type="submit" className="btn contact-submit">
            <FaIcon icon="fa-solid fa-paper-plane" /> {en ? 'Send message' : 'إرسال الرسالة'}
          </button>
        </form>

        <aside className="contact-aside">
          <div className="contact-card center">
            <FaIcon icon="fa-solid fa-envelope-open-text" />
            <h3>{en ? 'Email' : 'البريد الإلكتروني'}</h3>
            <p><a className="email-link" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
          </div>
          <div className="contact-card center">
            <FaIcon icon="fa-solid fa-clock" />
            <h3>{en ? 'Response time' : 'وقت الرد'}</h3>
            <p>{en ? 'Usually within 24 hours' : 'عادةً خلال 24 ساعة'}</p>
          </div>
          <div className="contact-card center">
            <FaIcon icon="fa-solid fa-bullhorn" />
            <h3>{en ? 'Advertise with us' : 'أعلن معانا'}</h3>
            <p>{en ? 'Reach thousands of daily gold & currency watchers in Egypt.' : 'وصل لآلاف المتابعين اليومي لأسعار الذهب والعملات في مصر.'}</p>
          </div>
          <RatingStars />
        </aside>
      </div>

      <section className="faq-section">
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-regular fa-circle-question" /> {en ? 'Frequently asked questions' : 'أسئلة شائعة'}</h2>
        </div>
        {FAQ.map((f, i) => (
          <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
            <button type="button" className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{en ? f.q.en : f.q.ar}</span>
              <FaIcon icon={`fa-solid fa-chevron-${open === i ? 'up' : 'down'}`} />
            </button>
            {open === i && <div className="faq-a">{en ? f.a.en : f.a.ar}</div>}
          </div>
        ))}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map((f) => ({
              '@type': 'Question',
              name: f.q.ar,
              acceptedAnswer: { '@type': 'Answer', text: f.a.ar },
            })),
          }),
        }}
      />
    </div>
  );
}

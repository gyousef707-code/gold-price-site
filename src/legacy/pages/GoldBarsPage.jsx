import { lazy, Suspense, useState } from 'react';
import { Link } from '@/lib/router-compat.jsx';
import JsonLd from '../components/JsonLd.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import useApiData from '../hooks/useApiData.js';
import { goldKaratsDesc } from '../data/gold.js';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/jsonld.js';

const PriceHistoryChart = lazy(() => import('../components/PriceHistoryChart.jsx'));

// أوزان السبائك الشائعة بالجرام (الأونصة = 31.1 جرام تقريبًا)
const BAR_WEIGHTS = [1, 2.5, 5, 10, 20, 31.1, 50, 100];
const fmt = (n) => (n != null ? Math.round(n).toLocaleString('en-US') : '—');
const label = (w) => (w === 31.1 ? 'أونصة (31.1 جرام)' : `${w} جرام`);

const FAQS = [
  [
    'كام سعر سبيكة الذهب اليوم؟',
    'سعر السبيكة بيتحسب من سعر جرام الذهب عيار 24 مضروبًا في وزنها. الجدول فوق بيعرض السعر الاسترشادي لكل وزن لحظة بلحظة، والسعر الفعلي عند الشركة ممكن يزيد عنه بحسب المصنعية ومصاريف السبك.',
  ],
  [
    'ليه سعر السبيكة في الشركة أعلى من الحساب في الجدول؟',
    'لأن الجدول بيحسب سعر الذهب الخام بس. الشركات بتضيف مصاريف التصنيع والتغليف والشهادة، وبتختلف من شركة للتانية ومن وزن للتاني، فاسأل عن السعر النهائي قبل الشراء.',
  ],
  [
    'أنهي وزن أنسب للادخار: سبيكة صغيرة ولا كبيرة؟',
    'السبائك الصغيرة سهلة في البيع التدريجي لكن مصاريفها على الجرام بتكون أعلى غالبًا، والسبائك الكبيرة مصاريفها على الجرام أقل لكنها أصعب لو احتجت تبيع جزء بسيط. اختار حسب المبلغ اللي هتدخره ومدة الاحتفاظ.',
  ],
  [
    'إزاي أتأكد إن السبيكة أصلية؟',
    'اشتري من شركة أو محل معروف، واتأكد إن السبيكة مختومة في غلافها الأصلي ومعاها شهادة فيها الوزن والعيار ورقم السبيكة، واحتفظ بالفاتورة. وده مهم جدًا عند إعادة البيع.',
  ],
  [
    'هل سعر الشراء من العميل بيكون زي سعر البيع؟',
    'لأ، فيه فرق دايمًا بين سعر البيع وسعر الشراء، وهو هامش التاجر. الجدول بيعرض الاتنين عشان تعرف الفرق قبل ما تقرر.',
  ],
];

export default function GoldBarsPage() {
  const { data } = useApiData('/api/public/gold-price', { intervalMs: 60000 });
  const k24 = data?.caratPrices?.['24'];
  const [grams, setGrams] = useState('');
  const g = Number(grams);
  const validG = grams !== '' && Number.isFinite(g) && g > 0;

  return (
    <div className="page-wrap">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'الرئيسية', path: '/' },
          { name: 'الأدوات', path: '/tools' },
          { name: 'سبائك الذهب', path: '/gold/bars' },
        ])}
      />
      <JsonLd data={faqJsonLd(FAQS)} />

      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link> / <Link to="/tools">الأدوات</Link> / سبائك الذهب
      </div>
      <span className="eyebrow">أسعار الذهب</span>
      <h1>سعر سبائك الذهب اليوم في مصر</h1>

      <div className="live-cta">
        <div>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>جرام عيار 24 (بيع): {fmt(k24?.sell)} ج.م</p>
          <p style={{ margin: 0 }}>جرام عيار 24 (شراء): {fmt(k24?.buy)} ج.م</p>
        </div>
        <Link to="/#tool-gold-calc" className="btn">احسب قيمة ذهبك</Link>
      </div>

      <p>
        سبائك الذهب بتتصنع من ذهب عيار 24 (نقاء حوالي 99.9%) وبتتباع بأوزان ثابتة. الجدول التالي
        بيحسب سعر كل وزن من سعر جرام عيار 24 اللحظي في مصر.
      </p>

      <section aria-labelledby="bars-h" style={{ margin: '18px 0' }}>
        <h2 id="bars-h">أسعار السبائك بالأوزان</h2>
        <table className="spec-table">
          <thead>
            <tr><th>الوزن</th><th>البيع</th><th>الشراء</th></tr>
          </thead>
          <tbody>
            {BAR_WEIGHTS.map((w) => (
              <tr key={w}>
                <th>{label(w)}</th>
                <td>{k24 ? `${fmt(k24.sell * w)} ج.م` : '—'}</td>
                <td>{k24 ? `${fmt(k24.buy * w)} ج.م` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 13, opacity: 0.75 }}>
          الأسعار استرشادية لسعر الذهب الخام فقط، ولا تشمل المصنعية ولا مصاريف السبك والتغليف اللي
          بتختلف من شركة لشركة.
        </p>
      </section>

      <section aria-labelledby="bars-calc-h" style={{ margin: '18px 0' }}>
        <h2 id="bars-calc-h">احسب سعر أي وزن</h2>
        <label htmlFor="bars-grams" style={{ display: 'block', marginBottom: 6 }}>
          اكتب الوزن بالجرام
        </label>
        <input
          id="bars-grams"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          placeholder="مثال: 15"
          style={{ width: '100%', maxWidth: 260, padding: '10px 12px', borderRadius: 10 }}
        />
        {validG && k24 && (
          <p style={{ marginTop: 10 }}>
            <strong>{grams} جرام:</strong> بيع {fmt(k24.sell * g)} ج.م، شراء {fmt(k24.buy * g)} ج.م
          </p>
        )}
      </section>

      <Suspense fallback={null}>
        <PriceHistoryChart
          endpoint="/api/public/gold-history"
          titleAr="تطور سعر ذهب عيار 24"
          titleEn="24K gold price trend"
          dataKey="karat24_sell"
          livePrice={k24?.sell ?? null}
          tone="gold"
        />
      </Suspense>

      <section aria-labelledby="bars-faq-h" style={{ margin: '18px 0' }}>
        <h2 id="bars-faq-h">أسئلة شائعة عن سبائك الذهب</h2>
        {FAQS.map(([q, a]) => (
          <details key={q} style={{ marginBottom: 8 }}>
            <summary style={{ fontWeight: 700, cursor: 'pointer' }}>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <RelatedArticles
        slugs={['gold-bar-vs-gold-pound', 'gold-bar-pound-manufacturing-cost', 'difference-21-24-karat']}
      />

      <div className="related-box">
        <h3>اقرأ أيضًا - أسعار العيارات</h3>
        <ul>
          {goldKaratsDesc.map((k) => (
            <li key={k.karat}><Link to={`/gold/${k.karat}`}>سعر عيار {k.karat} اليوم</Link></li>
          ))}
          <li><Link to="/gold/pound">سعر الجنيه الذهب اليوم</Link></li>
        </ul>
      </div>
    </div>
  );
}

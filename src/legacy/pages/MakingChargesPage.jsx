import { Link } from '@/lib/router-compat.jsx';
import JsonLd from '../components/JsonLd.jsx';
import GoldCalculator from '../components/calculators/GoldCalculator.jsx';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/jsonld.js';

const FAQ = [
  {
    q: 'يعني إيه مصنعية الذهب؟',
    a: 'المصنعية هي أجر تصنيع القطعة، بيضيفها الصايغ على سعر الذهب لما تشتري مشغولات أو حلي. يعني سعر القطعة = وزنها × سعر الجرام، زائد المصنعية.',
  },
  {
    q: 'بتتحسب المصنعية إزاي؟',
    a: 'غالبًا بتتحسب بمبلغ ثابت عن كل جرام، وساعات بنسبة من سعر القطعة. القيمة بتختلف من محل لمحل ومن تصميم لتاني، فالأفضل تسأل قبل الشراء وتقارن بين أكتر من محل.',
  },
  {
    q: 'إيه اللي بيخلي المصنعية أعلى أو أقل؟',
    a: 'التصميم الدقيق أو اليدوي مصنعيته أعلى من التصميم البسيط المصنوع بالماكينة. وكمان نوع القطعة وعيارها وسمعة المحل بتفرق.',
  },
  {
    q: 'لو بعت الذهب بترجّع المصنعية؟',
    a: 'في العادة لا. لما بتبيع ذهب مستعمل المحل بيحسب سعر الذهب بالوزن بس وبيخصم المصنعية، فهي بتعتبر تكلفة على الشاري. ولو عايز تقلل الخسارة، اختار قطع مصنعيتها قليلة أو سبائك وجنيهات ذهب.',
  },
  {
    q: 'ليه سعر الذهب بدون مصنعية مختلف عن السعر في المحل؟',
    a: 'السعر اللي بيظهر على الموقع هو سعر جرام الذهب نفسه. سعر المحل بيضيف عليه المصنعية، وممكن كمان رسوم تانية حسب القطعة، فبيطلع أعلى.',
  },
  {
    q: 'إزاي أستخدم الحاسبة؟',
    a: 'اكتب الوزن واختار العيار، وفي خانة المصنعية اكتب المبلغ عن الجرام الواحد. الحاسبة هتجمع المصنعية على سعر الجرام وتضرب في الوزن وتديك السعر النهائي للقطعة.',
  },
];

export default function MakingChargesPage() {
  return (
    <div className="page-wrap">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'الرئيسية', path: '/' },
          { name: 'الأدوات', path: '/tools' },
          { name: 'حاسبة سعر الذهب بالمصنعية', path: '/tools/making-charges' },
        ])}
      />

      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link> / <Link to="/tools">الأدوات</Link> / حاسبة المصنعية
      </div>
      <span className="eyebrow">الأدوات</span>
      <h1>حاسبة سعر الذهب بالمصنعية</h1>
      <p style={{ marginBottom: 14 }}>
        اعرف السعر النهائي للقطعة قبل ما تشتري: اكتب الوزن واختار العيار، وضيف المصنعية عن كل جرام، والحاسبة
        تحسب لك الإجمالي على سعر الذهب اللحظي في مصر.
      </p>

      <GoldCalculator />

      <section className="cp-section cp-about" aria-labelledby="mc-how-h">
        <h2 id="mc-how-h">سعر الذهب بالمصنعية: المعادلة</h2>
        <p>
          <strong>سعر القطعة = (سعر جرام الذهب + المصنعية عن الجرام) × الوزن</strong>
        </p>
        <p>
          مثال للتوضيح بأرقام افتراضية: قطعة وزنها 10 جرام عيار 21، وسعر الجرام 5,000 جنيه، والمصنعية 150 جنيه
          عن الجرام. السعر = (5,000 + 150) × 10 = 51,500 جنيه. منهم 1,500 جنيه مصنعية.
        </p>
        <p className="cp-note">
          الأرقام دي للتوضيح بس. شوف <Link to="/gold/21">سعر الذهب عيار 21 اليوم</Link> أو{' '}
          <Link to="/">سعر الذهب اليوم في مصر</Link> لتعرف السعر الحالي.
        </p>
      </section>

      <section className="cp-section cp-about" aria-labelledby="mc-tips-h">
        <h2 id="mc-tips-h">نصايح قبل ما تشتري</h2>
        <ul style={{ lineHeight: 2, paddingInlineStart: 20 }}>
          <li>اسأل عن المصنعية للجرام قبل ما تختار القطعة، وقارن بين أكتر من محل.</li>
          <li>اتأكد من الوزن والعيار والدمغة على الفاتورة.</li>
          <li>احتفظ بالفاتورة، لأنها بتفيدك عند البيع أو الاستبدال.</li>
          <li>لو الهدف ادخار، السبائك والجنيهات الذهب مصنعيتها أقل من المشغولات.</li>
        </ul>
      </section>

      <section className="cp-section cp-about" aria-labelledby="mc-faq-h">
        <JsonLd data={faqJsonLd(FAQ.map((f) => [f.q, f.a]))} />
        <h2 id="mc-faq-h">أسئلة شائعة عن مصنعية الذهب</h2>
        <div className="cp-faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <h2>أدوات مفيدة تانية</h2>
        <p>
          <Link to="/tools/zakat">حاسبة زكاة الذهب</Link> · <Link to="/gold/18">سعر الذهب عيار 18</Link> ·{' '}
          <Link to="/gold/pound">سعر الجنيه الذهب</Link> · <Link to="/tools">كل الأدوات</Link>
        </p>
      </section>
    </div>
  );
}

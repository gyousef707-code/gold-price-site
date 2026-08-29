// كومبوننت بسيط بيرندر سكريبت application/ld+json من object جاهز
// (أو أكتر من object مع بعض). نفس الطريقة المستخدمة أصلاً في ContactPage،
// هنا بس بقت قابلة لإعادة الاستخدام في أي صفحة تانية.
export default function JsonLd({ data }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

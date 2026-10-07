import { useEffect, useRef, useState } from 'react';

// يأجّل عرض (وبالتالي تحميل) أي مكوّن تقيل لحد ما المستخدم يقرّب منه في الصفحة.
// مثال: <LazyOnView minHeight={290}><PriceHistoryChart /></LazyOnView>
// minHeight بيحجز مساحة فاضية عشان الصفحة ما تقفزش لما المكوّن يظهر (CLS).
export default function LazyOnView({ children, minHeight = 290, rootMargin = '300px' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

// بيجيب بيانات من أي endpoint داخلي زي /api/gold-price، وبيعمل تحديث دوري (polling)
// initialData: لو اتبعتت (من بيانات السيرفر وقت التحميل الأول)، بتُستخدم كقيمة
// ابتدائية بدل ما نبدأ بـ null، عشان المحتوى يظهر فورًا من غير ما ننتظر أول طلب.
export default function useApiData(url, { intervalMs = 60000, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(initialData == null);
  const timerRef = useRef(null);
  // بنسجل هنا آخر بيانات ناجحة عرفناها عشان نقدر نرجعلها لو تحديث لاحق فشل،
  // من غير ما نستنى الـ state يتحدث (state ممكن يكون لسه القديم وقت الفحص).
  const hasDataRef = useRef(initialData != null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(url);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error || 'حصل خطأ في جلب البيانات');
        setData(json);
        setError(null);
        hasDataRef.current = true;
      } catch (e) {
        if (cancelled) return;
        // لو عندنا أصلاً أسعار ظاهرة من قبل، فشل تحديث واحد عابر (بطء نت،
        // تأخر لحظي من المصدر) مبيمسحش الأسعار الصحيحة الظاهرة ولا يوري
        // رسالة خطأ — بنسيبها زي ما هي ونستنى التحديث اللي بعده يظبط نفسه.
        // رسالة الخطأ بتظهر بس لو فشل أول تحميل ومفيش أي سعر ظاهر أصلاً.
        if (!hasDataRef.current) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    timerRef.current = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [url, intervalMs]);

  return { data, error, loading };
}

import { useEffect, useRef, useState } from 'react';

// بيجيب بيانات من أي endpoint داخلي زي /api/gold-price، وبيعمل تحديث دوري (polling)
// initialData: لو اتبعتت (من بيانات السيرفر وقت التحميل الأول)، بتُستخدم كقيمة
// ابتدائية بدل ما نبدأ بـ null، عشان المحتوى يظهر فورًا من غير ما ننتظر أول طلب.
export default function useApiData(url, { intervalMs = 60000, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(initialData == null);
  const timerRef = useRef(null);

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
      } catch (e) {
        if (!cancelled) setError(e.message);
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

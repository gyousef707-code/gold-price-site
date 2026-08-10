import { useEffect, useRef, useState } from 'react';

/**
 * بيخلي الرقم "حى" بين كل تحديث حقيقى والتانى:
 * بيعمل random walk بسيط جدًا حوالين القيمة الحقيقية (زى شريط تريدنج فيو)
 * من غير ما يبعد عنها أكتر من نسبة صغيرة.
 */
export default function useLiveTick(base, { volatility = 0.00012, intervalMs = 2200, enabled = true } = {}) {
  const [value, setValue] = useState(typeof base === 'number' ? base : null);
  const baseRef = useRef(base);
  const curRef = useRef(base);

  useEffect(() => {
    baseRef.current = base;
    if (typeof base === 'number') {
      curRef.current = base;
      setValue(base);
    }
  }, [base]);

  useEffect(() => {
    if (!enabled || typeof base !== 'number') return undefined;
    const id = setInterval(() => {
      const anchor = baseRef.current;
      if (typeof anchor !== 'number') return;
      // خطوة صغيرة جدًا + رجوع ناعم ناحية السعر الحقيقى = حركة طبيعية زى الشارت
      const drift = (Math.random() - 0.5) * 2 * volatility * anchor * 0.5;
      let next = (curRef.current ?? anchor) + drift;
      next += (anchor - next) * 0.12;
      const max = anchor * (1 + volatility);
      const min = anchor * (1 - volatility);
      next = Math.min(max, Math.max(min, next));
      curRef.current = next;
      setValue(next);
    }, intervalMs);
    return () => clearInterval(id);
  }, [base, volatility, intervalMs, enabled]);

  return value;
}

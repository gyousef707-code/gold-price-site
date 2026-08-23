import { useCallback, useEffect, useRef } from "react";

export default function useBackClose(active, onBack) {
  const cbRef = useRef(onBack);
  cbRef.current = onBack;
  const popped = useRef(false);

  const push = useCallback(() => {
    window.history.pushState({ __overlay: true }, "");
  }, []);

  useEffect(() => {
    if (!active || typeof window === "undefined") return undefined;
    popped.current = false;
    push();

    const onPop = () => {
      const keepOpen = cbRef.current?.();
      if (keepOpen) {
        push();
        return;
      }
      popped.current = true;
    };

    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // بنأخّر تنضيف نقطة التاريخ شوية: لو الإغلاق حصل بسبب الضغط على رابط
      // (زي "اتصل بنا") في نفس اللحظة، ده بيدّي وقت لانتقال الصفحة إنه
      // يسجّل نفسه الأول، بدل ما نلغيه بالغلط بـ history.back().
      if (!popped.current && window.history.state?.__overlay) {
        setTimeout(() => {
          if (window.history.state?.__overlay) window.history.back();
        }, 0);
      }
    };
  }, [active, push]);
}

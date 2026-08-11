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
      if (!popped.current && window.history.state?.__overlay) window.history.back();
    };
  }, [active, push]);
}

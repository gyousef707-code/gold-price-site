import { useEffect, useRef } from 'react';
import FaIcon from './FaIcon.jsx';

// ملاحظة: سكربت TradingView تقيل (حوالي 800 كيلوبايت). بنحمّله بس لما
// (1) المستخدم يعمل أي حركة في الصفحة (سكرول/لمس/ضغط) و
// (2) قسم الرسم يقرّب من الشاشة.
export default function TradingViewChart({ symbol, id }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let loaded = false;
    let interacted = false;
    let visible = typeof IntersectionObserver === 'undefined';
    let observer = null;
    const events = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'];

    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, onInteract));
      if (observer) observer.disconnect();
    };

    const load = () => {
      if (loaded) return;
      loaded = true;
      cleanup();
      el.innerHTML = '';
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: false,
        width: '100%',
        height: '350',
        symbol,
        interval: '60',
        timezone: 'Africa/Cairo',
        theme: 'dark',
        style: '1',
        locale: 'ar',
        enable_publishing: false,
        allow_symbol_change: true,
        calendar: false,
        support_host: 'https://www.tradingview.com',
      });
      el.appendChild(script);
    };

    const tryLoad = () => {
      if (interacted && visible) load();
    };

    function onInteract() {
      interacted = true;
      tryLoad();
    }

    events.forEach((e) => window.addEventListener(e, onInteract, { passive: true }));

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          tryLoad();
        },
        { rootMargin: '300px' }
      );
      observer.observe(el);
    }

    return cleanup;
  }, [symbol]);

  return (
    <section className="tradingview-section">
      <div className="section-title-bar">
        <h2><FaIcon icon="fa-solid fa-chart-area" /> الرسم البياني (TradingView)</h2>
      </div>
      <div className="tradingview-widget-container" style={{ minHeight: 350 }}>
        <div className="tradingview-widget-container__widget" id={id} ref={containerRef} />
      </div>
    </section>
  );
}

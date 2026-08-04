import { useEffect, useRef } from 'react';

export default function TradingViewChart({ symbol, id }) {
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const load = () => {
      if (loadedRef.current) return;
      loadedRef.current = true;
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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            load();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [symbol]);

  return (
    <section className="tradingview-section">
      <div className="section-title-bar">
        <h2><i className="fa-solid fa-chart-area" /> الرسم البياني (TradingView)</h2>
      </div>
      <div className="tradingview-widget-container">
        <div className="tradingview-widget-container__widget" id={id} ref={containerRef} />
      </div>
    </section>
  );
}

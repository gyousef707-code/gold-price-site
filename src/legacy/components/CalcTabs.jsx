import { Suspense, useEffect, useState } from 'react';

/**
 * Single card holding several calculators behind tabs.
 * Only the active tab's component is rendered, so each lazy() chunk
 * downloads the first time its tab is opened — never all at once.
 *
 * tabs: [{ id, label, render: () => ReactNode }]
 */
export default function CalcTabs({ tabs, storageKey }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const idx = tabs.findIndex((tb) => tb.id === hash);
    if (idx > -1) setActive(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const current = tabs[active] || tabs[0];

  return (
    <div className="calc-tabs-card">
      <div className="calc-tabs-bar" role="tablist">
        {tabs.map((tb, i) => (
          <button
            key={tb.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`calc-tab-btn${i === active ? ' is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            {tb.label}
          </button>
        ))}
      </div>
      <div className="calc-tabs-body" id={current.id}>
        <Suspense fallback={<div className="calc-tabs-loading">...</div>}>
          {current.render()}
        </Suspense>
      </div>
    </div>
  );
}

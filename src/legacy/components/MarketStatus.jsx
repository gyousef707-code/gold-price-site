import { useEffect, useState } from 'react';
import { marketStatusLabel } from '../lib/marketStatus.js';

// شارة السوق: بتفتح وتقفل لوحدها حسب توقيت السوق العالمى
export default function MarketStatus({ lang = 'ar' }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    const update = () => setState(marketStatusLabel(lang));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [lang]);

  if (!state) return <span className="market-status-badge" />;

  return (
    <span className={`market-status-badge ${state.open ? 'open' : 'closed'}`}>
      <span className="market-status-dot" /> {state.label}
    </span>
  );
}

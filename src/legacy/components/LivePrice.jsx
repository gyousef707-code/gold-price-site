import { useEffect, useRef, useState } from 'react';
import useLiveTick from '../hooks/useLiveTick.js';

// رقم حى: بيتحرك بس لما السعر الحقيقى يتغير (زى تريدنج فيو) + وميض أخضر/أحمر
export default function LivePrice({
  value: rawValue,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  duration = 700,
  placeholder = '—',
  live = false,
  volatility = 0,
  tickMs = 0,
}) {
  // شريط حى زى تريدنج فيو: الرقم بيتحرك بين كل تحديث حقيقى والتانى
  const ticked = useLiveTick(typeof rawValue === 'number' ? rawValue : null, {
    volatility: volatility || 0.00012,
    intervalMs: tickMs || 2400,
    enabled: live && typeof rawValue === 'number',
  });
  const value = live && typeof ticked === 'number' ? ticked : rawValue;
  const animMs = live ? Math.min(duration, tickMs || 2400) : duration;


  const [display, setDisplay] = useState(typeof value === 'number' ? value : null);
  const [dir, setDir] = useState(null);
  const prevRef = useRef(typeof value === 'number' ? value : null);
  const rafRef = useRef(null);


  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) return;
    const from = prevRef.current;

    if (from == null) {
      prevRef.current = value;
      setDisplay(value);
      return;
    }
    if (from === value) return;

    setDir(value > from ? 'up' : 'down');
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / animMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else {
        prevRef.current = value;
        setDisplay(value);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    const flashTimer = setTimeout(() => setDir(null), animMs + 400);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(flashTimer);
    };
  }, [value, animMs]);

  if (display == null) {
    return <span className={`live-price ${className}`}>{placeholder}</span>;
  }

  return (
    <span className={`live-price ${dir ? `tick-${dir}` : ''} ${className}`}>
      {prefix}
      {display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

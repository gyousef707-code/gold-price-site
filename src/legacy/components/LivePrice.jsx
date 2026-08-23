import { useEffect, useRef, useState } from 'react';

// رقم حى: بيتبدل فورًا لما السعر الحقيقى يتغير (من غير أى دوران أو أرقام بتلف)
export default function LivePrice({
  value: rawValue,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  placeholder = '—',
  // eslint-disable-next-line no-unused-vars
  duration,
  // eslint-disable-next-line no-unused-vars
  live,
  // eslint-disable-next-line no-unused-vars
  volatility,
  // eslint-disable-next-line no-unused-vars
  tickMs,
}) {
  const value = typeof rawValue === 'number' && !Number.isNaN(rawValue) ? rawValue : null;
  const [dir, setDir] = useState(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value == null) return undefined;
    const from = prevRef.current;
    prevRef.current = value;
    if (from == null || from === value) return undefined;
    setDir(value > from ? 'up' : 'down');
    const timer = setTimeout(() => setDir(null), 900);
    return () => clearTimeout(timer);
  }, [value]);

  if (value == null) {
    return <span className={`live-price ${className}`}>{placeholder}</span>;
  }

  return (
    <span className={`live-price ${dir ? `tick-${dir}` : ''} ${className}`}>
      {prefix}
      {value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

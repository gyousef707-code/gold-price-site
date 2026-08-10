// مؤشر الفجوة السعرية: دايرة تقدم زى اللى فى التصميم الأصلى
export default function GapGauge({ value, max = 10, label, unit = 'ج.م' }) {
  const size = 116;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = Math.min(1, Math.abs(Number(value) || 0) / max);
  const offset = c * (1 - ratio);
  const positive = (Number(value) || 0) >= 0;

  return (
    <div className="gap-gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="gap-gauge-svg">
        <defs>
          <linearGradient id="gapGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7d774" />
            <stop offset="100%" stopColor="#c99a2e" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="gap-gauge-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#gapGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="gap-gauge-progress"
        />
      </svg>
      <div className="gap-gauge-center">
        <span className={`gap-gauge-value ${positive ? 'up' : 'down'}`}>
          {value != null ? Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
        </span>
        <span className="gap-gauge-unit">{unit}</span>
        {label && <span className="gap-gauge-label">{label}</span>}
      </div>
    </div>
  );
}

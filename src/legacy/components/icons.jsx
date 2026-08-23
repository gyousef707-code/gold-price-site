// أيقونات SVG مخصصة — أوضح وأنضف من أيقونات الخطوط
export function SunIcon({ size = 18, className = '' }) {
  return (
    <svg
      className={`svg-icon sun-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
      <line x1="12" y1="1.6" x2="12" y2="4.4" />
      <line x1="12" y1="19.6" x2="12" y2="22.4" />
      <line x1="1.6" y1="12" x2="4.4" y2="12" />
      <line x1="19.6" y1="12" x2="22.4" y2="12" />
      <line x1="4.4" y1="4.4" x2="6.4" y2="6.4" />
      <line x1="17.6" y1="17.6" x2="19.6" y2="19.6" />
      <line x1="19.6" y1="4.4" x2="17.6" y2="6.4" />
      <line x1="6.4" y1="17.6" x2="4.4" y2="19.6" />
    </svg>
  );
}

export function MoonIcon({ size = 18, className = '' }) {
  return (
    <svg
      className={`svg-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AutoIcon({ size = 18, className = '' }) {
  return (
    <svg
      className={`svg-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

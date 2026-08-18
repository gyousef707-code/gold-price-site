import { useEffect, useState } from 'react';
import FaIcon from './FaIcon.jsx';

const TZ = 'Africa/Cairo';

export function formatStamp(date, lang = 'ar') {
  const locale = lang === 'en' ? 'en-GB' : 'ar-EG';
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
  const day = new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return { time, day };
}

// ختم الوقت والتاريخ — بيتحدث كل ثانية عشان الإحساس إن الأسعار حية
export default function UpdatedStamp({ lang = 'ar', label }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="updated-stamp" />;


  const { time, day } = formatStamp(now, lang);
  const text = label ?? (lang === 'en' ? 'Last update' : 'آخر تحديث');

  return (
    <div className="updated-stamp">
      <span className="updated-stamp-label">
        <FaIcon icon="fa-regular fa-clock" /> {text}
      </span>
      <span className="updated-stamp-time">{time}</span>
      <span className="updated-stamp-sep">•</span>
      <span className="updated-stamp-date">{day}</span>
    </div>
  );
}

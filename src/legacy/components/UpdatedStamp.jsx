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

// ختم الوقت والتاريخ — لو اتبعت `date` (وقت آخر تحديث حقيقي للبيانات من
// السيرفر)، بيعرضه ثابت زي ما هو عشان يبين فعلاً إمتى آخر مرة اتغيرت فيها
// البيانات. من غيره، بيرجع للسلوك القديم (ساعة حية بتتحدث كل ثانية) كاحتياطي.
export default function UpdatedStamp({ lang = 'ar', label, date }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    if (date) return; // عندنا وقت تحديث حقيقي، مش محتاجين نتك كل ثانية
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [date]);

  const stampDate = date ? new Date(date) : now;
  if (!stampDate) return <div className="updated-stamp" />;

  const { time, day } = formatStamp(stampDate, lang);
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

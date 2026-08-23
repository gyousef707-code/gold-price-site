// سوق المعادن العالمى (XAU/XAG) بيفتح الأحد 22:00 UTC وبيقفل الجمعة 21:00 UTC
// وفيه بريك يومى ساعة من 21:00 لـ 22:00 UTC.
export function isMetalsMarketOpen(now = new Date()) {
  const day = now.getUTCDay(); // 0 = الأحد
  const h = now.getUTCHours();
  const m = now.getUTCMinutes();
  const mins = h * 60 + m;

  if (day === 6) return false; // السبت
  if (day === 0) return mins >= 22 * 60; // الأحد بعد 22:00
  if (day === 5) return mins < 21 * 60; // الجمعة قبل 21:00
  // من الاتنين للخميس: مفتوح ما عدا 21:00 → 22:00
  return !(mins >= 21 * 60 && mins < 22 * 60);
}

export function marketStatusLabel(lang = 'ar', now = new Date()) {
  const open = isMetalsMarketOpen(now);
  return {
    open,
    label: open ? (lang === 'en' ? 'Market open' : 'السوق مفتوح') : lang === 'en' ? 'Market closed' : 'السوق مغلق',
  };
}

import FaIcon from './FaIcon.jsx';
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';

// جدول تاريخي عام (لآخر 30 يوم) — قابل لإعادة الاستخدام للذهب وللفضة، عن طريق
// تمرير endpoint مختلف وأعمدة مختلفة. بيتحدث مرة كل ساعة بس (مش لحظي زي باقي
// الصفحة)، لأن الغرض منه مرجع تاريخي مش سعر آني. لو الأرشيف لسه فاضي (أول أيام
// تفعيل الميزة) الكومبوننت مبيظهرش خالص لحد ما يتجمع يوم واحد على الأقل.
//
// columns: [{ key: 'karat24_sell', labelAr: 'عيار 24', labelEn: 'Karat 24' }, ...]
// primaryKey: مفتاح العمود المرجعي اللي بتتحسب عليه كروت الملخص (أعلى/أقل/آخر سعر
// والتغير خلال الفترة) وعمود "التغير اليومي". لو متمررش، بياخد أول عمود في columns.
export default function HistoryTable({ endpoint, titleAr, titleEn, columns, primaryKey }) {
  const { data, loading } = useApiData(endpoint, { intervalMs: 60 * 60 * 1000 });
  const { lang } = useLang();
  const rows = data?.history ?? [];

  if (loading || rows.length === 0) return null;

  const key = primaryKey ?? columns[0]?.key;

  const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-EG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  const fmtPct = (p) => (p == null ? '—' : `${p > 0 ? '+' : ''}${p.toFixed(2)}%`);
  const pctClass = (p) => (p == null ? 'hist-flat' : p > 0 ? 'hist-up' : p < 0 ? 'hist-down' : 'hist-flat');
  const pctIcon = (p) => (p == null ? null : p > 0 ? 'fa-solid fa-caret-up' : p < 0 ? 'fa-solid fa-caret-down' : null);

  // الصفوف جايه من الأحدث للأقدم (index 0 = أحدث يوم متاح).
  const values = rows.map((r) => r[key]).filter((v) => v != null);
  const lastVal = rows[0]?.[key] ?? null;
  const oldestVal = rows[rows.length - 1]?.[key] ?? null;
  const minVal = values.length ? Math.min(...values) : null;
  const maxVal = values.length ? Math.max(...values) : null;
  const periodChangePct =
    lastVal != null && oldestVal != null && oldestVal !== 0
      ? ((lastVal - oldestVal) / oldestVal) * 100
      : null;

  const dailyChangePct = (i) => {
    const cur = rows[i]?.[key];
    const prev = rows[i + 1]?.[key]; // اليوم اللي قبله بيوم واحد
    if (cur == null || prev == null || prev === 0) return null;
    return ((cur - prev) / prev) * 100;
  };

  const stats = [
    {
      label: lang === 'en' ? 'Change (period)' : 'التغير خلال الفترة',
      value: fmtPct(periodChangePct),
      cls: pctClass(periodChangePct),
    },
    { label: lang === 'en' ? 'Lowest' : 'أقل سعر', value: fmt(minVal), cls: 'hist-neutral' },
    { label: lang === 'en' ? 'Highest' : 'أعلى سعر', value: fmt(maxVal), cls: 'hist-neutral' },
    { label: lang === 'en' ? 'Last price' : 'آخر سعر', value: fmt(lastVal), cls: 'hist-gold' },
  ];

  return (
    <section className="page-tools">
      <div className="section-title-bar">
        <h2>
          <FaIcon icon="fa-solid fa-clock-rotate-left" /> {lang === 'en' ? titleEn : titleAr}
        </h2>
      </div>

      <div className="history-stats-grid">
        {stats.map((s) => (
          <div className="history-stat-card" key={s.label}>
            <div className="hs-label">{s.label}</div>
            <div className={`hs-value ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="history-table-card">
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>{lang === 'en' ? 'Date' : 'اليوم'}</th>
                {columns.map((c) => (
                  <th key={c.key}>{lang === 'en' ? c.labelEn : c.labelAr}</th>
                ))}
                <th>{lang === 'en' ? 'Daily change' : 'التغير اليومي'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const dc = dailyChangePct(i);
                const icon = pctIcon(dc);
                return (
                  <tr key={row.date} className={i === 0 ? 'history-row-today' : ''}>
                    <td className="hist-date-cell">
                      {fmtDate(row.date)}
                      {i === 0 && (
                        <span className="hist-today-badge">{lang === 'en' ? 'Today' : 'اليوم'}</span>
                      )}
                    </td>
                    {columns.map((c) => (
                      <td key={c.key} className={c.key === key ? 'hist-primary-col' : ''}>
                        {fmt(row[c.key])}
                      </td>
                    ))}
                    <td className={pctClass(dc)}>
                      {icon && <FaIcon icon={icon} />} {fmtPct(dc)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="history-table-note">
          {lang === 'en'
            ? 'The archive records once a day (Cairo time); prices shown are sell prices.'
            : 'الأرشيف يتسجّل مرة واحدة يوميًا بتوقيت القاهرة، والأسعار المعروضة هي أسعار البيع.'}
        </div>
      </div>
    </section>
  );
}

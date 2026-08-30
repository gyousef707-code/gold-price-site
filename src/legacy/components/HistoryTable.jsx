import FaIcon from './FaIcon.jsx';
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';

// جدول تاريخي عام (لآخر 30 يوم) — قابل لإعادة الاستخدام للذهب وللفضة، عن طريق
// تمرير endpoint مختلف وأعمدة مختلفة. بيتحدث مرة كل ساعة بس (مش لحظي زي باقي
// الصفحة)، لأن الغرض منه مرجع تاريخي مش سعر آني. لو الأرشيف لسه فاضي (أول أيام
// تفعيل الميزة) الكومبوننت مبيظهرش خالص لحد ما يتجمع يوم واحد على الأقل.
//
// columns: [{ key: 'karat24_sell', labelAr: 'عيار 24', labelEn: 'Karat 24' }, ...]
export default function HistoryTable({ endpoint, titleAr, titleEn, columns }) {
  const { data, loading } = useApiData(endpoint, { intervalMs: 60 * 60 * 1000 });
  const { lang } = useLang();
  const rows = data?.history ?? [];

  if (loading || rows.length === 0) return null;

  const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-EG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  return (
    <section className="page-tools">
      <div className="section-title-bar">
        <h2>
          <FaIcon icon="fa-solid fa-clock-rotate-left" /> {lang === 'en' ? titleEn : titleAr}
        </h2>
      </div>
      <div className="history-table-wrap" style={{ overflowX: 'auto' }}>
        <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>{lang === 'en' ? 'Date' : 'اليوم'}</th>
              {columns.map((c) => (
                <th key={c.key}>{lang === 'en' ? c.labelEn : c.labelAr}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date}>
                <td>{fmtDate(row.date)}</td>
                {columns.map((c) => (
                  <td key={c.key}>{fmt(row[c.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

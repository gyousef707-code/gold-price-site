import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import FaIcon from './FaIcon.jsx';
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';

// رسم بياني لتطور السعر خلال آخر 30 يوم (بديل الجدول التاريخي النصي).
// بيستخدم نفس مصدر البيانات القديم (/api/public/gold-history أو silver-history)
// وبيتحدث مرة كل ساعة لأنه مرجع تاريخي مش سعر لحظي.
export default function PriceHistoryChart({
  endpoint,
  titleAr,
  titleEn,
  dataKey,
  tone = 'gold',
}) {
  const { data, loading } = useApiData(endpoint, { intervalMs: 60 * 60 * 1000 });
  const { lang } = useLang();
  const en = lang === 'en';
  const rows = data?.history ?? [];

  const stroke = tone === 'silver' ? '#c9d1d9' : '#e3b341';
  const strokeSoft = tone === 'silver' ? '#8b949e' : '#b8860b';
  const gradId = `hist-grad-${tone}`;

  // البيانات جاية من الأحدث للأقدم — بنعكسها عشان المحور يمشي بالوقت
  const series = [...rows]
    .reverse()
    .filter((r) => r?.[dataKey] != null)
    .map((r) => ({
      date: r.date,
      value: Number(r[dataKey]),
      label: new Date(r.date).toLocaleDateString(en ? 'en-GB' : 'ar-EG', {
        day: 'numeric',
        month: 'short',
      }),
    }));

  const title = en ? titleEn : titleAr;

  const first = series[0]?.value ?? null;
  const last = series[series.length - 1]?.value ?? null;
  const changePct =
    first != null && last != null && first !== 0 ? ((last - first) / first) * 100 : null;

  const values = series.map((s) => s.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const pad = Math.max((max - min) * 0.15, 1);

  return (
    <section className="page-tools">
      <div className="section-title-bar">
        <h2>
          <FaIcon icon="fa-solid fa-chart-area" /> {title}
        </h2>
      </div>

      <div className={`price-chart-card ${tone}`}>
        {loading && series.length === 0 ? (
          <>
            <div className="sk sk-line lg" style={{ width: '40%' }} />
            <div className="sk" style={{ height: 180, borderRadius: 12, marginTop: 10 }} />
          </>
        ) : series.length < 2 ? (
          <p className="price-chart-meta" style={{ padding: '70px 10px', textAlign: 'center' }}>
            {en ? 'History is being collected…' : 'الأرشيف بيتجمع… ارجع تاني قريب'}
          </p>
        ) : (
          <>
            <div className="price-chart-head">
              <span className="price-chart-last">
                {last.toLocaleString('en-US')} {en ? 'EGP' : 'ج.م'}
              </span>
              {changePct != null && (
                <span className={`price-chart-change ${changePct >= 0 ? 'up' : 'down'}`}>
                  {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%{' '}
                  <span className="price-chart-meta">{en ? '30 days' : 'خلال 30 يوم'}</span>
                </span>
              )}
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={series} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`${gradId}-line`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={strokeSoft} />
                    <stop offset="100%" stopColor={stroke} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#8b949e' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  orientation="right"
                  domain={[min - pad, max + pad]}
                  tick={{ fontSize: 10, fill: '#8b949e' }}
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  tickFormatter={(v) => Number(v).toLocaleString('en-US')}
                />
                <Tooltip
                  cursor={{ stroke, strokeOpacity: 0.35 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="price-chart-tip">
                        <div>{p.label}</div>
                        <b>
                          {Number(p.value).toLocaleString('en-US')} {en ? 'EGP' : 'ج.م'}
                        </b>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={`url(#${gradId}-line)`}
                  strokeWidth={2.5}
                  fill={`url(#${gradId})`}
                  dot={false}
                  activeDot={{ r: 4, fill: stroke, stroke: '#0d1117', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </section>
  );
}

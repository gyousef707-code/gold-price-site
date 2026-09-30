import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import FaIcon from './FaIcon.jsx';
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';

// رسم بياني لتطور السعر بستايل TradingView:
// - أزرار مدى زمني (أسبوع / شهر / 3 شهور / 6 شهور / سنة)
// - محور الأسعار على اليمين بأرقام مقرّبة ومرتبة (خارج الرسم مش فوقه)
// - خط أفقي منقّط عند آخر سعر وعليه شارة بالسعر
// البيانات بتيجي مرة واحدة (سنة كاملة) ويتم التقطيع على الجهاز، فتغيير المدى فوري.
// المصدر: /api/public/gold-history أو silver-history، بيتحدث كل ساعة.
const RANGES = [
  { days: 7, ar: 'أسبوع', en: '1W', metaAr: 'خلال أسبوع', metaEn: '1 week' },
  { days: 30, ar: 'شهر', en: '1M', metaAr: 'خلال شهر', metaEn: '1 month' },
  { days: 90, ar: '3 شهور', en: '3M', metaAr: 'خلال 3 شهور', metaEn: '3 months' },
  { days: 180, ar: '6 شهور', en: '6M', metaAr: 'خلال 6 شهور', metaEn: '6 months' },
  { days: 365, ar: 'سنة', en: '1Y', metaAr: 'خلال سنة', metaEn: '1 year' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// خطوة \"حلوة\" للمحور (1 / 2 / 2.5 / 5 × 10^n) عشان الأرقام تبقى مرتبة زي 6,000 و 6,100
function niceStep(rough) {
  if (!(rough > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / pow;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * pow;
}

function buildAxis(min, max) {
  const span = Math.max(max - min, max * 0.004, 1);
  const step = niceStep((span * 1.25) / 4);
  const lo = Math.floor((min - span * 0.12) / step) * step;
  const hi = Math.ceil((max + span * 0.12) / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { domain: [lo, hi], ticks };
}

export default function PriceHistoryChart({
  endpoint,
  titleAr,
  titleEn,
  dataKey,
  tone = 'gold',
}) {
  const { data, loading } = useApiData(`${endpoint}?days=365`, { intervalMs: 60 * 60 * 1000 });
  const { lang } = useLang();
  const en = lang === 'en';
  const rows = data?.history ?? [];
  const [picked, setPicked] = useState(null);

  const stroke = tone === 'silver' ? '#c9d1d9' : '#e3b341';
  const strokeSoft = tone === 'silver' ? '#8b949e' : '#b8860b';
  const gradId = `hist-grad-${tone}`;

  // البيانات جاية من الأحدث للأقدم — بنعكسها عشان المحور يمشي بالوقت
  const all = useMemo(
    () =>
      [...rows]
        .reverse()
        .filter((r) => r?.[dataKey] != null)
        .map((r) => ({ date: r.date, ts: new Date(`${r.date}T00:00:00Z`).getTime(), value: Number(r[dataKey]) })),
    [rows, dataKey],
  );

  // كام يوم فعلاً متاح في الأرشيف (من أقدم لقطة لآخر لقطة)
  const spanDays = all.length > 1 ? Math.round((all[all.length - 1].ts - all[0].ts) / DAY_MS) : 0;
  // المدى بيتفعّل بس لو الأرشيف أطول من المدى اللي قبله (يعني هيضيف معلومة جديدة)
  const enabled = RANGES.map((r, i) => i === 0 || spanDays > RANGES[i - 1].days);
  const defaultIdx = Math.max(0, Math.min(enabled.lastIndexOf(true), 1));
  const activeIdx = picked != null && enabled[picked] ? picked : defaultIdx;
  const range = RANGES[activeIdx];

  const series = useMemo(() => {
    if (!all.length) return [];
    const lastTs = all[all.length - 1].ts;
    const cutoff = lastTs - range.days * DAY_MS;
    const longRange = range.days > 180;
    return all
      .filter((r) => r.ts >= cutoff)
      .map((r) => ({
        ...r,
        label: new Date(r.ts).toLocaleDateString(en ? 'en-GB' : 'ar-EG', {
          day: longRange ? undefined : 'numeric',
          month: 'short',
          year: longRange ? '2-digit' : undefined,
          timeZone: 'UTC',
        }),
        full: new Date(r.ts).toLocaleDateString(en ? 'en-GB' : 'ar-EG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }),
      }));
  }, [all, range.days, en]);

  const title = en ? titleEn : titleAr;
  const first = series[0]?.value ?? null;
  const last = series[series.length - 1]?.value ?? null;
  const changePct =
    first != null && last != null && first !== 0 ? ((last - first) / first) * 100 : null;

  const values = series.map((s) => s.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const axis = useMemo(() => buildAxis(min, max), [min, max]);
  const currency = en ? 'EGP' : 'ج.م';

  return (
    <section className="page-tools">
      <div className="section-title-bar">
        <h2>
          <FaIcon icon="fa-solid fa-chart-area" /> {title}
        </h2>
      </div>

      <div className={`price-chart-card ${tone}`}>
        {loading && all.length === 0 ? (
          <>
            <div className="sk sk-line lg" style={{ width: '40%' }} />
            <div className="sk" style={{ height: 180, borderRadius: 12, marginTop: 10 }} />
          </>
        ) : all.length < 2 ? (
          <p className="price-chart-meta" style={{ padding: '70px 10px', textAlign: 'center' }}>
            {en ? 'History is being collected…' : 'الأرشيف بيتجمع… ارجع تاني قريب'}
          </p>
        ) : (
          <>
            <div className="price-chart-head">
              <span className="price-chart-last">
                {last.toLocaleString('en-US')} {currency}
              </span>
              {changePct != null && (
                <span className={`price-chart-change ${changePct >= 0 ? 'up' : 'down'}`}>
                  {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%{' '}
                  <span className="price-chart-meta">{en ? range.metaEn : range.metaAr}</span>
                </span>
              )}
            </div>

            <div className="price-range-bar" role="tablist" aria-label={en ? 'Time range' : 'المدى الزمني'}>
              {RANGES.map((r, i) => (
                <button
                  key={r.days}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIdx}
                  disabled={!enabled[i]}
                  title={!enabled[i] ? (en ? 'Not enough history yet' : 'الأرشيف لسه مجمّعش بيانات كفاية للمدى ده') : undefined}
                  className={`price-range-btn${i === activeIdx ? ' is-active' : ''}`}
                  onClick={() => setPicked(i)}
                >
                  {en ? r.en : r.ar}
                </button>
              ))}
            </div>

            {/* direction:ltr ضروري: الصفحة RTL فكانت أرقام المحور بتتحط جوه الرسم فوق الخط */}
            <div className="price-chart-plot" style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart accessibilityLayer={false} data={series} margin={{ top: 8, right: 0, left: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={`${gradId}-line`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={strokeSoft} />
                      <stop offset="100%" stopColor={stroke} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.07)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#8b949e' }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                    padding={{ left: 4, right: 4 }}
                  />
                  <YAxis
                    orientation="right"
                    domain={axis.domain}
                    ticks={axis.ticks}
                    tick={{ fontSize: 10, fill: '#8b949e' }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    tickFormatter={(v) => Number(v).toLocaleString('en-US')}
                  />
                  <ReferenceLine
                    y={last}
                    stroke={stroke}
                    strokeDasharray="2 3"
                    strokeOpacity={0.6}
                    ifOverflow="extendDomain"
                  />
                  <Tooltip
                    cursor={{ stroke: '#8b949e', strokeDasharray: '3 3', strokeOpacity: 0.7 }}
                    position={{ y: 0 }}
                    allowEscapeViewBox={{ x: false, y: false }}
                    wrapperStyle={{ pointerEvents: 'none', zIndex: 5 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="price-chart-tip" dir={en ? 'ltr' : 'rtl'}>
                          <div>{p.full}</div>
                          <b>
                            {Number(p.value).toLocaleString('en-US')} {currency}
                          </b>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={`url(#${gradId}-line)`}
                    strokeWidth={2.4}
                    fill={`url(#${gradId})`}
                    dot={false}
                    activeDot={{ r: 4, fill: stroke, stroke: '#0d1117', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

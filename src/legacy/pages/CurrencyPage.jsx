import { Link, useParams } from '@/lib/router-compat.jsx';
import FaIcon from '../components/FaIcon.jsx';
import LivePrice from '../components/LivePrice.jsx';
import UpdatedStamp from '../components/UpdatedStamp.jsx';
import CurrencyConverter from '../components/CurrencyConverter.jsx';
import JsonLd from '../components/JsonLd.jsx';
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';
import { CURRENCY_META } from '../data/currencies.js';
import { shareCard } from '../lib/shareCard.js';
import { breadcrumbJsonLd } from '@/lib/jsonld.js';

export default function CurrencyPage() {
  const params = useParams();
  const code = String(params.code || 'usd').toLowerCase();
  const meta = CURRENCY_META[code];
  const { data, loading, error } = useApiData('/api/public/currency-price', { intervalMs: 2 * 60000 });
  const { t, lang } = useLang();
  const r = data?.rates?.[code];

  if (!meta) {
    return (
      <div className="page-wrap">
        <p className="error-text">{lang === 'en' ? 'Currency not found' : 'العملة غير موجودة'}</p>
        <Link to="/currencies">{lang === 'en' ? 'Back to currencies' : 'رجوع للعملات'}</Link>
      </div>
    );
  }

  const share = () =>
    shareCard(
      {
        title: lang === 'en' ? `${meta.name} price today` : `سعر ${meta.name} اليوم`,
        subtitle: `${code.toUpperCase()} / EGP`,
        rows: [
          { label: lang === 'en' ? 'Buy' : 'شراء', value: r ? `${r.buy} ج.م` : '—', color: '#f85149' },
          { label: lang === 'en' ? 'Sell' : 'بيع', value: r ? `${r.sell} ج.م` : '—', color: '#3fb950' },
        ],
      },
      `${meta.name}: ${r?.sell ?? '—'} ج.م`
    );

  return (
    <div className="page-wrap">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'الرئيسية', path: '/' },
          { name: 'العملات', path: '/currencies' },
          { name: meta.name, path: `/currency/${code}` },
        ])}
      />
      <div className="breadcrumb">
        <Link to="/">{lang === 'en' ? 'Home' : 'الرئيسية'}</Link> /{' '}
        <Link to="/currencies">{lang === 'en' ? 'Currencies' : 'العملات'}</Link> / {meta.name}
      </div>

      <section className="global-ounce-section">
        <div className="ounce-card">
          <div className="ounce-header">
            <span>
              <img src={`https://flagcdn.com/32x24/${meta.flag}.png`} width="24" height="18" alt={code} style={{ borderRadius: 4, verticalAlign: 'middle', marginInlineEnd: 8 }} />
              {meta.name} — {code.toUpperCase()}/EGP
            </span>
            <button className="card-share-btn" onClick={share} aria-label={t('share.price')} title={t('share.price')}>
              <FaIcon icon="fa-solid fa-share-nodes" />
            </button>
          </div>
          <div className="ounce-price">
            <LivePrice value={r?.mid ?? null} decimals={2} suffix=" ج.م" live volatility={0.00015} tickMs={2200} />
          </div>
          <UpdatedStamp lang={lang} date={data?.updated_at} />
        </div>
      </section>

      {loading && <p className="loading-text">{t('loading')}</p>}
      {error && !loading && <p className="error-text">{t('error')}</p>}

      <section>
        <div className="gold-cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="gold-card">
            <div className="gold-card-icon-top"><FaIcon icon="fa-solid fa-arrow-down" /></div>
            <div className="gold-v-row">
              <span className="gold-v-label">{lang === 'en' ? 'Buy' : 'شراء'}</span>
              <span className="gold-v-value buy-price"><LivePrice value={r?.buy ?? null} decimals={2} /></span>
            </div>
          </div>
          <div className="gold-card">
            <div className="gold-card-icon-top"><FaIcon icon="fa-solid fa-arrow-up" /></div>
            <div className="gold-v-row">
              <span className="gold-v-label">{lang === 'en' ? 'Sell' : 'بيع'}</span>
              <span className="gold-v-value sell-price"><LivePrice value={r?.sell ?? null} decimals={2} /></span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-solid fa-right-left" /> {t('converter.title')}</h2>
        </div>
        <CurrencyConverter rates={data?.rates} selected={code} />
      </section>

    </div>
  );
}

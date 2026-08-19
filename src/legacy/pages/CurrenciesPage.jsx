import { useRef, useState } from 'react';
import FaIcon from '../components/FaIcon.jsx';
import { Link } from '@/lib/router-compat.jsx';
import Seo from '../components/Seo.jsx';
import CurrencyConverter from '../components/CurrencyConverter.jsx';
import RelatedArticles from '../components/RelatedArticles.jsx';
import NewsList from '../components/NewsList.jsx';
import LivePrice from '../components/LivePrice.jsx';
import UpdatedStamp from '../components/UpdatedStamp.jsx';
import useApiData from '../hooks/useApiData.js';
import { useLang } from '../context/LangContext.jsx';
import { CURRENCY_META, CURRENCY_ORDER } from '../data/currencies.js';

export default function CurrenciesPage() {
  const { data, loading, error } = useApiData('/api/public/currency-price', { intervalMs: 2 * 60000 });
  const { t, lang } = useLang();
  const [selected, setSelected] = useState(null);
  const converterRef = useRef(null);

  const pick = (code) => {
    setSelected(code);
    converterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="page-wrap">
      <Seo
        title="اسعار العملات اليوم في مصر | ذهبي"
        description="تابع اسعار العملات اليوم بالجنيه المصري لحظة بلحظة، ومحول عملات مجاني بين أكتر من 14 عملة."
        keywords="اسعار العملات, سعر الدولار اليوم, سعر اليورو"
        path="/currencies"
      />

      <section ref={converterRef}>
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-solid fa-right-left" /> {t('converter.title')}</h2>
        </div>
        <CurrencyConverter rates={data?.rates} selected={selected} />
        <UpdatedStamp lang={lang} date={data?.updated_at} />
      </section>

      <section>
        <div className="section-title-bar">
          <h2><FaIcon icon="fa-solid fa-list" /> {t('currencies.list')}</h2>
        </div>
        {loading && <p className="loading-text">{t('loading')}</p>}
        {error && !loading && <p className="error-text">{t('error')}</p>}
        <div className="currency-list-new">
          {CURRENCY_ORDER.map((code) => {
            const r = data?.rates?.[code];
            const meta = CURRENCY_META[code];
            const active = selected === code;
            return (
              <div
                key={code}
                role="button"
                tabIndex={0}
                className={`currency-card-new${active ? ' selected' : ''}`}
                onClick={() => pick(code)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick(code)}
                title={lang === 'en' ? 'Use in converter' : 'استخدمها في المحول'}
              >
                <div className="currency-card-left">
                  <div className="currency-card-flag">
                    <img src={`https://flagcdn.com/32x24/${meta.flag}.png`} width="24" height="18" alt={code} loading="lazy" style={{ borderRadius: 4 }} />
                  </div>
                  <div className="currency-card-info">
                    <div className="currency-card-name">{meta.name}</div>
                    <div className="currency-card-code">{code.toUpperCase()} / EGP</div>
                  </div>
                </div>
                <div className="currency-card-right">
                  <div className="currency-card-price-box">
                    <div className="currency-card-price-label">{lang === 'en' ? 'Buy' : 'شراء'}</div>
                    <div className="currency-card-price-value buy">
                      <LivePrice value={r?.buy ?? null} decimals={2} live volatility={0.00012} tickMs={2600} />
                    </div>
                  </div>
                  <div className="currency-card-price-box">
                    <div className="currency-card-price-label">{lang === 'en' ? 'Sell' : 'بيع'}</div>
                    <div className="currency-card-price-value sell">
                      <LivePrice value={r?.sell ?? null} decimals={2} live volatility={0.00012} tickMs={2600} />
                    </div>
                  </div>
                  <Link
                    to={`/currency/${code}`}
                    className="card-details-link"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={lang === 'en' ? 'Details' : 'التفاصيل'}
                  >
                    <FaIcon icon="fa-solid fa-chevron-left" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <RelatedArticles slugs={['gold-price-forecast-2026', 'why-gold-price-differs-shops', 'gold-price-today-egypt']} />

      <NewsList />
    </div>
  );
}

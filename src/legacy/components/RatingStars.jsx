import { useEffect, useState } from 'react';
import FaIcon from './FaIcon.jsx';
import { useLang } from '../context/LangContext.jsx';
import { showToast } from '../lib/shareCard.js';

// تقييم بخمس نجوم — بيتخزن محليًا
export default function RatingStars({ compact = false }) {
  const { t, lang } = useLang();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const r = Number(localStorage.getItem('app-rating') || 0);
    if (r) {
      setRating(r);
      setSaved(true);
    }
  }, []);

  const pick = (n) => {
    setRating(n);
    setSaved(true);
    localStorage.setItem('app-rating', String(n));
    showToast(t('rate.thanks'));
  };

  return (
    <div className={`rating-widget ${compact ? 'compact' : ''}`}>
      <span className="rating-title">{t('rate.title')}</span>
      <div className="rating-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rating-star ${(hover || rating) >= n ? 'on' : ''}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => pick(n)}
            aria-label={`${n} / 5`}
          >
            <FaIcon icon="fa-solid fa-star" />
          </button>
        ))}
      </div>
      {saved && (
        <span className="rating-done">
          {lang === 'en' ? `Your rating: ${rating}/5` : `تقييمك: ${rating}/5`}
        </span>
      )}
    </div>
  );
}

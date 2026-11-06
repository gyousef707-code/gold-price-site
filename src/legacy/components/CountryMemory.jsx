import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from '@/lib/router-compat.jsx';
import { countryFromPath } from '../hooks/useCountry.js';

// بيفتكر آخر دولة كنت فيها: لو قفلت التطبيق وفتحته تاني من الصفحة الرئيسية،
// بيودّيك على نفس الدولة. ولو اخترت مصر من القايمة بيرجع يفتح على مصر.
const KEY = 'app-last-country';

export default function CountryMemory() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const firstRun = useRef(true);

  // أول فتح للتطبيق: لو الرابط الرئيسي "/" وفيه دولة محفوظة، ودّيه عليها (مرة واحدة بس في الجلسة)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('country-restored')) return;
      sessionStorage.setItem('country-restored', '1');
      const saved = localStorage.getItem(KEY);
      if (pathname === '/' && saved && countryFromPath(`/${saved}`)) {
        navigate({ to: `/${saved}`, replace: true });
      }
    } catch {
      /* لو التخزين مش متاح نكمل عادي */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // كل ما تدخل صفحة دولة نحفظها، ولما ترجع للرئيسية بتاعة مصر (بعد أول فتح) نمسحها
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      const code = countryFromPath(pathname);
      if (code) {
        try { localStorage.setItem(KEY, code); } catch { /* تجاهل */ }
      }
      return;
    }
    try {
      const code = countryFromPath(pathname);
      if (code) localStorage.setItem(KEY, code);
      else if (pathname === '/') localStorage.removeItem(KEY);
    } catch {
      /* تجاهل */
    }
  }, [pathname]);

  return null;
}

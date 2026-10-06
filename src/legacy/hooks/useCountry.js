import { useLocation } from '@/lib/router-compat.jsx';
import { COUNTRY_CODES } from '../data/countryCodes.js';

// بيرجّع كود الدولة الحالية (sa, ae, ...) من أول جزء في الرابط، أو null لو إحنا في مصر
export function countryFromPath(pathname = '/') {
  const seg = pathname.split('/')[1];
  return COUNTRY_CODES.includes(seg) ? seg : null;
}

export default function useCountryCode() {
  const { pathname } = useLocation();
  return countryFromPath(pathname);
}

// بيحوّل مسار عادي لمسار الدولة: ('sa', '/silver') => '/sa/silver'، ومن غير دولة بيرجّع المسار زي ما هو
export function cpath(code, path = '/') {
  if (!code) return path;
  return path === '/' ? `/${code}` : `/${code}${path}`;
}

// طبقة توافق بسيطة: بتخلي كود الصفحات القديم (react-router-dom) يشتغل على TanStack Router
import {
  Link as TSLink,
  Outlet,
  useNavigate,
  useLocation,
  useParams as useTSParams,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect } from 'react';

function parseTo(to) {
  const raw = String(to || '/');
  const [pathAndQuery, hash] = raw.split('#');
  const [path, query] = pathAndQuery.split('?');
  const result = { to: path || '/' };
  if (hash) result.hash = hash;
  if (query) {
    const search = {};
    for (const [k, v] of new URLSearchParams(query)) search[k] = v;
    result.search = search;
  }
  return result;
}

export function Link({ to, children, ...rest }) {
  return (
    <TSLink {...parseTo(to)} {...rest}>
      {children}
    </TSLink>
  );
}

export function NavLink({ to, end, className, children, ...rest }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const target = String(to);
  const isActive = end
    ? pathname === target
    : pathname === target || pathname.startsWith(target.replace(/\/$/, '') + '/');
  const cls = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <Link to={to} className={cls} {...rest}>
      {children}
    </Link>
  );
}

export function Navigate({ to, replace = false }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ ...parseTo(to), replace });
  }, [to, replace, navigate]);
  return null;
}

export function useParams() {
  return useTSParams({ strict: false });
}

export { Outlet, useNavigate, useLocation };

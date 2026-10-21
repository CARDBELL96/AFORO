// Router mínimo basado en la History API (sin dependencias).
import { useSyncExternalStore, type MouseEvent, type ReactNode } from 'react';

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener('popstate', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('popstate', cb);
  };
}

const snapshot = () => window.location.pathname + window.location.search;

export interface RouteLocation {
  path: string;
  search: string;
}

export function useRoute(): RouteLocation {
  const key = useSyncExternalStore(subscribe, snapshot, () => '/');
  const i = key.indexOf('?');
  return { path: i < 0 ? key : key.slice(0, i), search: i < 0 ? '' : key.slice(i) };
}

export interface NavigateOptions {
  replace?: boolean;
  /** Por defecto, al cambiar de ruta se vuelve arriba. Los filtros lo desactivan. */
  scroll?: boolean;
}

export function navigate(to: string, opts: NavigateOptions = {}): void {
  const samePath = to.split('?')[0] === window.location.pathname;
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  listeners.forEach((l) => l());
  if (opts.scroll !== false && !samePath) window.scrollTo({ top: 0, left: 0 });
}

export type Match =
  | { name: 'home' }
  | { name: 'events' }
  | { name: 'event'; slug: string }
  | { name: 'notfound' };

export function matchRoute(path: string): Match {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  if (clean === '/') return { name: 'home' };
  if (clean === '/eventos') return { name: 'events' };
  const m = /^\/eventos\/([a-z0-9-]+)$/.exec(clean);
  if (m && m[1]) return { name: 'event', slug: m[1] };
  return { name: 'notfound' };
}

interface LinkProps {
  to: string;
  children?: ReactNode;
  className?: string;
  replace?: boolean;
  scroll?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  [attr: string]: unknown;
}

export function Link({ to, children, className, replace, scroll, onClick, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to, { replace, scroll });
  };
  return (
    <a href={to} className={className} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

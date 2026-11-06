// Router mínimo basado en la History API (sin dependencias).
import { useSyncExternalStore, type MouseEvent, type ReactNode } from 'react';

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener('popstate', cb);
  window.addEventListener('hashchange', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('popstate', cb);
    window.removeEventListener('hashchange', cb);
  };
}

const snapshot = () =>
  window.location.pathname + window.location.search + window.location.hash;

export interface RouteLocation {
  path: string;
  search: string;
  hash: string;
}

export function parseRouteLocation(raw: string): RouteLocation {
  const hashIdx = raw.indexOf('#');
  const beforeHash = hashIdx < 0 ? raw : raw.slice(0, hashIdx);
  const hash = hashIdx < 0 ? '' : raw.slice(hashIdx);
  const searchIdx = beforeHash.indexOf('?');
  const path = searchIdx < 0 ? beforeHash : beforeHash.slice(0, searchIdx);
  const search = searchIdx < 0 ? '' : beforeHash.slice(searchIdx);
  return { path: path || '/', search, hash };
}

export function useRoute(): RouteLocation {
  const key = useSyncExternalStore(subscribe, snapshot, () => '/');
  return parseRouteLocation(key);
}

export interface NavigateOptions {
  replace?: boolean;
  /** Por defecto, al cambiar de ruta se vuelve arriba. Los filtros lo desactivan. */
  scroll?: boolean;
}

export function navigate(to: string, opts: NavigateOptions = {}): void {
  const parsed = parseRouteLocation(to);
  const samePath = parsed.path === window.location.pathname;
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  listeners.forEach((l) => l());
  if (opts.scroll !== false && !samePath && !parsed.hash) {
    window.scrollTo({ top: 0, left: 0 });
  }
}

export type Match =
  | { name: 'home' }
  | { name: 'events' }
  | { name: 'event'; slug: string }
  | { name: 'notfound' };

export function matchRoute(path: string): Match {
  const { path: pathname } = parseRouteLocation(path);
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (clean === '/') return { name: 'home' };
  if (clean === '/eventos') return { name: 'events' };
  const m = /^\/eventos\/([a-z0-9-]+)$/.exec(clean);
  if (m && m[1]) return { name: 'event', slug: m[1] };
  return { name: 'notfound' };
}

export interface LinkProps {
  to: string;
  children?: ReactNode;
  className?: string;
  replace?: boolean;
  scroll?: boolean;
  newTab?: boolean;
  target?: string;
  rel?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  [attr: string]: unknown;
}

export function resolveLinkAttrs({
  to,
  newTab,
  target,
  rel,
}: Pick<LinkProps, 'to' | 'newTab' | 'target' | 'rel'>) {
  const opensInNewTab = Boolean(newTab || target === '_blank');
  return {
    href: to,
    target: opensInNewTab ? '_blank' : target,
    rel: opensInNewTab ? 'noopener noreferrer' : rel,
    opensInNewTab,
  };
}

export function Link({
  to,
  children,
  className,
  replace,
  scroll,
  newTab,
  target,
  rel,
  onClick,
  ...rest
}: LinkProps) {
  const resolved = resolveLinkAttrs({ to, newTab, target, rel });
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (resolved.opensInNewTab) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    navigate(to, { replace, scroll });
  };
  return (
    <a
      href={resolved.href}
      target={resolved.target}
      rel={resolved.rel}
      className={className}
      onClick={handle}
      {...rest}
    >
      {children}
    </a>
  );
}

import { GENRES, type AforoEvent, type GenreId } from '../data/events';
import { effectiveEnd, limaWeekday } from './format';

export type WhenId = 'any' | '30d' | '90d' | 'weekend';
export type SortId = 'date' | 'price-asc' | 'price-desc' | 'featured';

export interface Filters {
  q: string;
  genre: GenreId | null;
  city: string | null;
  when: WhenId;
  maxPrice: number | null;
  sort: SortId;
  saved: boolean;
  onlyAvailable?: boolean;
  monthKey?: string | null;
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  genre: null,
  city: null,
  when: 'any',
  maxPrice: null,
  sort: 'date',
  saved: false,
  onlyAvailable: false,
  monthKey: null,
};

export const WHEN_OPTIONS: { id: WhenId; label: string }[] = [
  { id: 'any', label: 'Cualquier fecha' },
  { id: '30d', label: 'Próximos 30 días' },
  { id: '90d', label: 'Próximos 3 meses' },
  { id: 'weekend', label: 'Fines de semana' },
];

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: 'date', label: 'Más próximos' },
  { id: 'featured', label: 'Curaduría AFORO' },
  { id: 'price-asc', label: 'Precio: menor a mayor' },
  { id: 'price-desc', label: 'Precio: mayor a menor' },
];

/** Minúsculas y sin tildes, para buscar sin importar cómo se escriba. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function genreLabel(id: GenreId): string {
  return GENRES.find((g) => g.id === id)?.label ?? id;
}

/** Precio más bajo entre las entradas disponibles (si todas están agotadas, el más bajo a secas). */
export function minPrice(ev: AforoEvent): number {
  const available = ev.tiers.filter((t) => t.status !== 'sold_out');
  const pool = available.length ? available : ev.tiers;
  return Math.min(...pool.map((t) => t.price));
}

export function isSoldOut(ev: AforoEvent): boolean {
  return ev.tiers.every((t) => t.status === 'sold_out');
}

export function upcoming(events: readonly AforoEvent[], now: Date): AforoEvent[] {
  return events.filter((e) => effectiveEnd(e).getTime() >= now.getTime());
}

export function matchesQuery(ev: AforoEvent, q: string): boolean {
  const needle = normalize(q);
  if (!needle) return true;
  const hay = normalize(
    [
      ev.title,
      ev.kicker,
      ev.artist,
      ev.city,
      ev.district,
      ev.venue,
      ev.code,
      ev.editorialTag,
      genreLabel(ev.genre),
      ...ev.tags,
      ...ev.lineup.map((l) => l.name),
    ].join(' '),
  );
  return needle.split(/\s+/).every((word) => hay.includes(word));
}

function matchesWhen(ev: AforoEvent, when: WhenId, now: Date): boolean {
  const start = new Date(ev.startsAt).getTime();
  const day = 24 * 3600_000;
  switch (when) {
    case 'any':
      return true;
    case '30d':
      return start <= now.getTime() + 30 * day;
    case '90d':
      return start <= now.getTime() + 90 * day;
    case 'weekend': {
      const wd = limaWeekday(ev.startsAt);
      return wd === 5 || wd === 6 || wd === 0;
    }
  }
}

export function filterEvents(
  events: readonly AforoEvent[],
  f: Filters,
  now: Date,
  savedIds: ReadonlySet<string> = new Set(),
): AforoEvent[] {
  const list = upcoming(events, now).filter(
    (e) =>
      matchesQuery(e, f.q) &&
      (!f.genre || e.genre === f.genre) &&
      (!f.city || e.city === f.city) &&
      matchesWhen(e, f.when, now) &&
      (f.maxPrice === null || minPrice(e) <= f.maxPrice) &&
      (!f.saved || savedIds.has(e.id)) &&
      (!f.onlyAvailable || !isSoldOut(e)) &&
      (!f.monthKey || e.startsAt.startsWith(f.monthKey)),
  );
  const byDate = (a: AforoEvent, b: AforoEvent) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  switch (f.sort) {
    case 'featured':
      return list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || byDate(a, b));
    case 'price-asc':
      return list.sort((a, b) => minPrice(a) - minPrice(b) || byDate(a, b));
    case 'price-desc':
      return list.sort((a, b) => minPrice(b) - minPrice(a) || byDate(a, b));
    default:
      return list.sort(byDate);
  }
}

export function citiesWithCount(events: readonly AforoEvent[]): { city: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of events) map.set(e.city, (map.get(e.city) ?? 0) + 1);
  return [...map].map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'es'));
}

export function activeFilterCount(f: Filters): number {
  return (
    (f.q ? 1 : 0) +
    (f.genre ? 1 : 0) +
    (f.city ? 1 : 0) +
    (f.when !== 'any' ? 1 : 0) +
    (f.maxPrice !== null ? 1 : 0) +
    (f.saved ? 1 : 0) +
    (f.onlyAvailable ? 1 : 0) +
    (f.monthKey ? 1 : 0)
  );
}

// ── URL ⇄ filtros (los filtros viven en la URL para poder compartirlos) ─────────────────
export function parseFilters(search: string): Filters {
  const p = new URLSearchParams(search);
  const genre = p.get('genero');
  const when = p.get('cuando');
  const sort = p.get('orden');
  const max = Number(p.get('max'));
  const monthKey = p.get('mes');
  return {
    q: (p.get('q') ?? '').slice(0, 80),
    genre: GENRES.some((g) => g.id === genre) ? (genre as GenreId) : null,
    city: p.get('ciudad') || null,
    when: WHEN_OPTIONS.some((w) => w.id === when) ? (when as WhenId) : 'any',
    maxPrice: p.get('max') && Number.isFinite(max) && max > 0 ? max : null,
    sort: SORT_OPTIONS.some((s) => s.id === sort) ? (sort as SortId) : 'date',
    saved: p.get('guardados') === '1',
    onlyAvailable: p.get('disponibles') === '1',
    monthKey: monthKey || null,
  };
}

export function serializeFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.genre) p.set('genero', f.genre);
  if (f.city) p.set('ciudad', f.city);
  if (f.when !== 'any') p.set('cuando', f.when);
  if (f.maxPrice !== null) p.set('max', String(f.maxPrice));
  if (f.sort !== 'date') p.set('orden', f.sort);
  if (f.saved) p.set('guardados', '1');
  if (f.onlyAvailable) p.set('disponibles', '1');
  if (f.monthKey) p.set('mes', f.monthKey);
  const s = p.toString();
  return s ? `?${s}` : '';
}

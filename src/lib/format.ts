import type { AforoEvent } from '../data/events';

const TZ = 'America/Lima';
const LOCALE = 'es-PE';

function part(iso: string, opts: Intl.DateTimeFormatOptions, type: Intl.DateTimeFormatPartTypes): string {
  const parts = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, ...opts }).formatToParts(new Date(iso));
  return parts.find((p) => p.type === type)?.value ?? '';
}

const clean = (s: string) => s.replace(/\./g, '').trim();

export interface DayParts {
  weekday: string; // SÁB
  day: string; // 21
  month: string; // NOV
  year: string; // 2026
}

export function dayParts(iso: string): DayParts {
  return {
    weekday: clean(part(iso, { weekday: 'short' }, 'weekday')).toUpperCase(),
    day: String(Number(part(iso, { day: 'numeric' }, 'day'))),
    month: clean(part(iso, { month: 'short' }, 'month')).toUpperCase(),
    year: part(iso, { year: 'numeric' }, 'year'),
  };
}

/** Hora en formato 24 h de Lima: "21:00". */
export function formatTime(iso: string): string {
  const h = part(iso, { hour: '2-digit', hourCycle: 'h23' }, 'hour').padStart(2, '0');
  const m = part(iso, { minute: '2-digit' }, 'minute').padStart(2, '0');
  return `${h}:${m}`;
}

/** "sábado 21 de noviembre" */
export function formatLongDate(iso: string): string {
  const weekday = part(iso, { weekday: 'long' }, 'weekday');
  const day = String(Number(part(iso, { day: 'numeric' }, 'day')));
  const month = part(iso, { month: 'long' }, 'month');
  return `${weekday} ${day} de ${month}`;
}

/** Clave AAAA-MM-DD en hora de Lima, útil para comparar días. */
export function limaDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}

/** Día de la semana en Lima: 0 = domingo … 6 = sábado. */
export function limaWeekday(iso: string): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(new Date(iso));
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name);
}

/** "21 NOV" o "12–14 DIC" para eventos de varios días. */
export function dateLabel(ev: Pick<AforoEvent, 'startsAt' | 'endsAt'>): string {
  const a = dayParts(ev.startsAt);
  if (ev.endsAt && limaDateKey(ev.endsAt) !== limaDateKey(ev.startsAt)) {
    const b = dayParts(ev.endsAt);
    return a.month === b.month ? `${a.day}–${b.day} ${a.month}` : `${a.day} ${a.month} – ${b.day} ${b.month}`;
  }
  return `${a.day} ${a.month}`;
}

export function formatPrice(n: number): string {
  return Number.isInteger(n) ? `S/ ${n}` : `S/ ${n.toFixed(2)}`;
}

/** Fecha y hora de fin efectiva (si no hay `endsAt`, se asume una duración de 6 h). */
export function effectiveEnd(ev: Pick<AforoEvent, 'startsAt' | 'endsAt'>): Date {
  return ev.endsAt ? new Date(ev.endsAt) : new Date(new Date(ev.startsAt).getTime() + 6 * 3600_000);
}

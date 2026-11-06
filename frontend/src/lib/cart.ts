import type { AforoEvent, TicketTier } from '../data/events';

export interface CartLine {
  eventId: string;
  tierId: string;
  qty: number;
}

export interface ResolvedLine {
  line: CartLine;
  event: AforoEvent;
  tier: TicketTier;
}

export const MAX_PER_TIER = 8;

const same = (a: CartLine, eventId: string, tierId: string) => a.eventId === eventId && a.tierId === tierId;
const clamp = (n: number) => Math.max(0, Math.min(MAX_PER_TIER, Math.floor(n)));

export function setQty(lines: readonly CartLine[], eventId: string, tierId: string, qty: number): CartLine[] {
  const q = clamp(qty);
  const rest = lines.filter((l) => !same(l, eventId, tierId));
  if (q === 0) return rest;
  const idx = lines.findIndex((l) => same(l, eventId, tierId));
  if (idx === -1) return [...rest, { eventId, tierId, qty: q }];
  return lines.map((l) => (same(l, eventId, tierId) ? { ...l, qty: q } : l));
}

export function addLine(lines: readonly CartLine[], eventId: string, tierId: string, qty = 1): CartLine[] {
  const current = lines.find((l) => same(l, eventId, tierId))?.qty ?? 0;
  return setQty(lines, eventId, tierId, current + qty);
}

export function removeLine(lines: readonly CartLine[], eventId: string, tierId: string): CartLine[] {
  return lines.filter((l) => !same(l, eventId, tierId));
}

/** Cruza las líneas con los eventos y descarta las que ya no existen o están agotadas. */
export function resolveLines(lines: readonly CartLine[], events: readonly AforoEvent[]): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  for (const line of lines) {
    const event = events.find((e) => e.id === line.eventId);
    const tier = event?.tiers.find((t) => t.id === line.tierId);
    if (event && tier && tier.status !== 'sold_out') out.push({ line, event, tier });
  }
  return out;
}

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function cartTotal(lines: readonly CartLine[], events: readonly AforoEvent[]): number {
  return resolveLines(lines, events).reduce((sum, r) => sum + r.tier.price * r.line.qty, 0);
}

/** Valida lo que viene de localStorage (puede estar corrupto o manipulado). */
export function sanitizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const item of raw) {
    if (item && typeof item === 'object') {
      const { eventId, tierId, qty } = item as Record<string, unknown>;
      if (typeof eventId === 'string' && typeof tierId === 'string' && typeof qty === 'number') {
        const q = clamp(qty);
        if (q > 0) out.push({ eventId, tierId, qty: q });
      }
    }
  }
  return out;
}

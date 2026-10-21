// Estado global unificado de AFORO Fusion:
// - Eventos (carga/error/listo)
// - Carrito lateral (persistido)
// - Guardados / favoritos (persistidos)
// - Billetera de entradas demo «Mis Entradas» con QR (persistida)
// - Modal rápido de ficha y plano de sectores (quickEventSlug)
// - Ciudad global activa
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { AforoEvent } from '../data/events';
import { INITIAL_DEMO_TICKETS, type DemoUserTicket } from '../data/editorial';
import { fetchEvents } from '../data/repository';
import { addLine, removeLine, sanitizeLines, setQty as setLineQty, type CartLine } from './cart';

export type EventsState =
  | { status: 'loading' }
  | { status: 'ready'; events: AforoEvent[] }
  | { status: 'error'; message: string };

interface Store {
  eventsState: EventsState;
  events: AforoEvent[];
  reload: () => void;
  now: Date;
  lines: CartLine[];
  addToCart: (eventId: string, tierId: string, qty?: number) => void;
  setQty: (eventId: string, tierId: string, qty: number) => void;
  removeFromCart: (eventId: string, tierId: string) => void;
  clearCart: () => void;
  saved: ReadonlySet<string>;
  toggleSaved: (eventId: string) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  ticketsOpen: boolean;
  setTicketsOpen: (open: boolean) => void;
  tickets: DemoUserTicket[];
  addDemoTicket: (ticket: DemoUserTicket) => void;
  removeDemoTicket: (ticketId: string) => void;
  quickEvent: AforoEvent | null;
  openQuickEvent: (event: AforoEvent) => void;
  closeQuickEvent: () => void;
  globalCity: string;
  setGlobalCity: (city: string) => void;
}

const CART_KEY = 'aforo.fusion.cart.v1';
const SAVED_KEY = 'aforo.fusion.saved.v1';
const TICKETS_KEY = 'aforo.fusion.tickets.v1';

function readJSON(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible: la app sigue funcionando sin persistencia */
  }
}

const Ctx = createContext<Store | null>(null);
const EMPTY: AforoEvent[] = [];

export function StoreProvider({ children }: PropsWithChildren) {
  const [eventsState, setEventsState] = useState<EventsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [now] = useState(() => new Date('2026-10-20T18:00:00-05:00'));
  const [lines, setLines] = useState<CartLine[]>(() => sanitizeLines(readJSON(CART_KEY)));
  const [saved, setSaved] = useState<ReadonlySet<string>>(() => {
    const raw = readJSON(SAVED_KEY);
    return new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []);
  });
  const [tickets, setTickets] = useState<DemoUserTicket[]>(() => {
    const raw = readJSON(TICKETS_KEY);
    if (Array.isArray(raw) && raw.length > 0) return raw as DemoUserTicket[];
    return INITIAL_DEMO_TICKETS;
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [quickEvent, setQuickEvent] = useState<AforoEvent | null>(null);
  const [globalCity, setGlobalCity] = useState<string>('TODAS');

  useEffect(() => {
    let cancelled = false;
    setEventsState({ status: 'loading' });
    const simulate = attempt === 0 && new URLSearchParams(window.location.search).get('simular') === 'error' ? 'error' : null;
    fetchEvents({ simulate })
      .then((events) => !cancelled && setEventsState({ status: 'ready', events }))
      .catch((err: unknown) =>
        !cancelled && setEventsState({ status: 'error', message: err instanceof Error ? err.message : 'Error desconocido' }),
      );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => writeJSON(CART_KEY, lines), [lines]);
  useEffect(() => writeJSON(SAVED_KEY, [...saved]), [saved]);
  useEffect(() => writeJSON(TICKETS_KEY, tickets), [tickets]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const addToCart = useCallback((e: string, t: string, q = 1) => setLines((l) => addLine(l, e, t, q)), []);
  const setQty = useCallback((e: string, t: string, q: number) => setLines((l) => setLineQty(l, e, t, q)), []);
  const removeFromCart = useCallback((e: string, t: string) => setLines((l) => removeLine(l, e, t)), []);
  const clearCart = useCallback(() => setLines([]), []);
  const toggleSaved = useCallback(
    (id: string) =>
      setSaved((s) => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );

  const addDemoTicket = useCallback((ticket: DemoUserTicket) => {
    setTickets((prev) => [ticket, ...prev]);
  }, []);

  const removeDemoTicket = useCallback((ticketId: string) => {
    setTickets((prev) => prev.filter((tk) => tk.ticketId !== ticketId));
  }, []);

  const openQuickEvent = useCallback((ev: AforoEvent) => setQuickEvent(ev), []);
  const closeQuickEvent = useCallback(() => setQuickEvent(null), []);

  const events = eventsState.status === 'ready' ? eventsState.events : EMPTY;

  const value = useMemo<Store>(
    () => ({
      eventsState,
      events,
      reload,
      now,
      lines,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      saved,
      toggleSaved,
      cartOpen,
      setCartOpen,
      searchOpen,
      setSearchOpen,
      ticketsOpen,
      setTicketsOpen,
      tickets,
      addDemoTicket,
      removeDemoTicket,
      quickEvent,
      openQuickEvent,
      closeQuickEvent,
      globalCity,
      setGlobalCity,
    }),
    [
      eventsState,
      events,
      reload,
      now,
      lines,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      saved,
      toggleSaved,
      cartOpen,
      setCartOpen,
      ticketsOpen,
      tickets,
      addDemoTicket,
      removeDemoTicket,
      quickEvent,
      openQuickEvent,
      closeQuickEvent,
      globalCity,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return s;
}

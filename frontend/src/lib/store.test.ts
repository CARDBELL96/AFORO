import { test } from 'node:test';
import assert from 'node:assert/strict';
import React, { type ReactElement } from 'react';
import {
  CART_KEY,
  SAVED_KEY,
  StoreProvider,
  TICKETS_KEY,
  useStore,
  type StorageEventLike,
  type Store,
} from './store';
import type { DemoUserTicket } from '../data/editorial';

/**
 * Entorno ligero de ventana multi-pestaña para pruebas de integración de `StoreProvider`
 * en Node.js sin requerir dependencias externas.
 */
function createMultiTabWindowEnv() {
  const storageMap = new Map<string, string>();
  const tabListeners = new Map<string, Set<(e: StorageEventLike) => void>>();

  function createTabWindow(tabId: string) {
    const listeners = new Set<(e: StorageEventLike) => void>();
    tabListeners.set(tabId, listeners);

    return {
      location: { pathname: '/', search: '', hash: '' },
      localStorage: {
        getItem(key: string): string | null {
          return storageMap.get(key) ?? null;
        },
        setItem(key: string, value: string): void {
          const oldValue = storageMap.get(key) ?? null;
          storageMap.set(key, value);
          if (oldValue === value) return;
          // El estándar Web Storage dispara el evento 'storage' en TODAS las demás pestañas abiertas
          for (const [otherTabId, otherSet] of tabListeners.entries()) {
            if (otherTabId === tabId) continue;
            for (const fn of otherSet) {
              fn({ key, newValue: value });
            }
          }
        },
      },
      addEventListener(type: string, fn: (e: StorageEventLike) => void) {
        if (type === 'storage') listeners.add(fn);
      },
      removeEventListener(type: string, fn: (e: StorageEventLike) => void) {
        if (type === 'storage') listeners.delete(fn);
      },
    };
  }

  return { createTabWindow, storageMap };
}

/**
 * Monta un componente funcional de React (`StoreProvider`) y un consumidor (`useStore`)
 * ejecutando su ciclo completo de hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`).
 */
function mountStoreProviderInstance(tabWindow: ReturnType<ReturnType<typeof createMultiTabWindowEnv>['createTabWindow']>) {
  const internals = (
    React as unknown as {
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: unknown };
    }
  ).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

  const states: unknown[] = [];
  const effects: Array<{
    create: () => void | (() => void);
    deps?: readonly unknown[];
    cleanup?: void | (() => void);
    dirty: boolean;
  }> = [];
  const memos: Array<{ val: unknown; deps?: readonly unknown[] }> = [];
  let stateCursor = 0;
  let effectCursor = 0;
  let memoCursor = 0;
  let currentContextValue: Store | null = null;
  let mounted = false;

  const depsChanged = (prev?: readonly unknown[], next?: readonly unknown[]) => {
    if (!prev || !next || prev.length !== next.length) return true;
    return next.some((v, i) => !Object.is(v, prev[i]));
  };

  const dispatcher = {
    useState<T>(init: T | (() => T)): [T, (next: T | ((prev: T) => T)) => void] {
      const idx = stateCursor++;
      if (!mounted && !(idx in states)) {
        states[idx] = typeof init === 'function' ? (init as () => T)() : init;
      }
      const setState = (updater: T | ((prev: T) => T)) => {
        const prev = states[idx] as T;
        const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
        if (!Object.is(prev, next)) {
          states[idx] = next;
          render();
        }
      };
      return [states[idx] as T, setState];
    },
    useEffect(create: () => void | (() => void), deps?: readonly unknown[]) {
      const idx = effectCursor++;
      const prev = effects[idx];
      if (!prev || depsChanged(prev.deps, deps)) {
        effects[idx] = { create, deps, cleanup: prev?.cleanup, dirty: true };
      }
    },
    useMemo<T>(create: () => T, deps?: readonly unknown[]): T {
      const idx = memoCursor++;
      const prev = memos[idx];
      if (!prev || depsChanged(prev.deps, deps)) {
        const val = create();
        memos[idx] = { val, deps };
        return val;
      }
      return prev.val as T;
    },
    useCallback<T extends (...args: never[]) => unknown>(fn: T, deps?: readonly unknown[]): T {
      return dispatcher.useMemo(() => fn, deps);
    },
    useContext(ctx: { _currentValue?: Store | null }): Store | null {
      return currentContextValue ?? ctx._currentValue ?? null;
    },
  };

  function runPendingEffects() {
    for (const eff of effects) {
      if (!eff.dirty) continue;
      eff.dirty = false;
      if (eff.cleanup) eff.cleanup();
      eff.cleanup = eff.create();
    }
  }

  function render() {
    const prevWin = (globalThis as { window?: unknown }).window;
    const prevDispatcher = internals.H;
    (globalThis as { window?: unknown }).window = tabWindow;
    internals.H = dispatcher;
    stateCursor = 0;
    effectCursor = 0;
    memoCursor = 0;
    try {
      const providerEl = StoreProvider({ children: null }) as ReactElement<{ value: Store }>;
      currentContextValue = providerEl.props.value;
      const consumed = useStore();
      assert.equal(consumed, currentContextValue);
      mounted = true;
    } finally {
      internals.H = prevDispatcher;
      (globalThis as { window?: unknown }).window = prevWin;
    }
    const prevWin2 = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = tabWindow;
    try {
      runPendingEffects();
    } finally {
      (globalThis as { window?: unknown }).window = prevWin2;
    }
  }

  render();

  return {
    getStore(): Store {
      if (!currentContextValue) throw new Error('StoreProvider no montado');
      return currentContextValue;
    },
    act(fn: () => void) {
      const prevWin = (globalThis as { window?: unknown }).window;
      (globalThis as { window?: unknown }).window = tabWindow;
      try {
        fn();
      } finally {
        (globalThis as { window?: unknown }).window = prevWin;
      }
    },
    unmount() {
      for (const eff of effects) {
        if (typeof eff.cleanup === 'function') eff.cleanup();
      }
    },
  };
}

test('integración StoreProvider: sincroniza carrito, favoritos y pases QR demo entre pestañas en < 100ms', () => {
  const env = createMultiTabWindowEnv();
  const tabAWindow = env.createTabWindow('tab-catalog');
  const tabBWindow = env.createTabWindow('tab-event-detail');

  const tabA = mountStoreProviderInstance(tabAWindow);
  const tabB = mountStoreProviderInstance(tabBWindow);

  assert.deepEqual(tabA.getStore().lines, []);
  assert.deepEqual(tabB.getStore().lines, []);

  // 1. En la pestaña B (/eventos/:slug#entradas) el usuario agrega 2 entradas al carrito
  const t0 = performance.now();
  tabB.act(() => {
    tabB.getStore().addToCart('ev-001', 'campo', 2);
  });
  const elapsedCartMs = performance.now() - t0;

  assert.deepEqual(tabB.getStore().lines, [{ eventId: 'ev-001', tierId: 'campo', qty: 2 }]);
  assert.deepEqual(
    tabA.getStore().lines,
    [{ eventId: 'ev-001', tierId: 'campo', qty: 2 }],
    'La pestaña A debe recibir automáticamente las líneas del carrito desde la pestaña B',
  );
  assert.ok(elapsedCartMs < 100, `La sincronización del carrito tardó ${elapsedCartMs}ms (debe ser < 100ms)`);

  // 2. En la pestaña B el usuario guarda el evento en favoritos
  tabB.act(() => {
    tabB.getStore().toggleSaved('ev-005');
  });
  assert.equal(tabA.getStore().saved.has('ev-005'), true);

  // 3. En la pestaña B el usuario emite un pase QR (Demo) con estado ACTIVA_DEMO
  const demoPass: DemoUserTicket = {
    ticketId: 'AFR-TK-7788',
    eventId: 'ev-001',
    eventSlug: 'pulso-lima-2026',
    eventTitle: 'PULSO LIMA',
    artist: 'LOS MIRLOS',
    city: 'Lima',
    venue: 'Explanada Costa Verde',
    dateFormatted: 'SÁB 14 NOV · 21:00',
    doorsTime: 'Puertas 19:00 h',
    zoneName: 'Campo General',
    seatOrAccess: '2x LOCALIDAD DEMO · CAMPO GENERAL',
    holderName: 'VALERIA MENDOZA · DEMO',
    pricePaid: 240,
    status: 'ACTIVA_DEMO',
    pulseHash: 'PULSO-LIM-7788-DEMO',
    createdAt: '2026-10-20',
  };

  const t1 = performance.now();
  tabB.act(() => {
    tabB.getStore().addDemoTicket(demoPass);
  });
  const elapsedTicketMs = performance.now() - t1;

  assert.equal(tabA.getStore().tickets[0]?.ticketId, 'AFR-TK-7788');
  assert.equal(tabA.getStore().tickets[0]?.status, 'ACTIVA_DEMO');
  assert.ok(elapsedTicketMs < 100, `La sincronización del pase demo tardó ${elapsedTicketMs}ms (debe ser < 100ms)`);

  // Verificar persistencia efectiva en localStorage bajo las claves oficiales
  assert.ok(env.storageMap.get(CART_KEY)?.includes('"ev-001"'));
  assert.ok(env.storageMap.get(SAVED_KEY)?.includes('"ev-005"'));
  assert.ok(env.storageMap.get(TICKETS_KEY)?.includes('"AFR-TK-7788"'));

  tabA.unmount();
  tabB.unmount();
});

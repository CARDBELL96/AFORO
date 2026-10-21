import { useEffect, useState } from 'react';
import type { AforoEvent } from '../data/events';
import { MAX_PER_TIER } from '../lib/cart';
import { formatPrice } from '../lib/format';
import { useStore } from '../lib/store';
import { Icon } from './Icon';
import { Stepper } from './Stepper';

interface TicketPickerProps {
  event: AforoEvent;
  selectedTierId?: string;
  onSelectTier?: (tierId: string) => void;
}

/**
 * Talón de entradas con forma de ticket físico troquelado (de Claude),
 * sincronizado con el plano acústico de sectores y las barras de disponibilidad (de Gemini).
 */
export function TicketPicker({ event, selectedTierId, onSelectTier }: TicketPickerProps) {
  const { addToCart, setCartOpen } = useStore();
  const firstAvailable = event.tiers.find((t) => t.status !== 'sold_out');
  const [qty, setQty] = useState<Record<string, number>>(() => (firstAvailable ? { [firstAvailable.id]: 1 } : {}));

  // Cuando el usuario hace clic en un sector del plano SVG, aseguramos al menos 1 entrada en ese sector
  useEffect(() => {
    if (!selectedTierId) return;
    const tier = event.tiers.find((t) => t.id === selectedTierId);
    if (!tier || tier.status === 'sold_out') return;
    setQty((prev) => {
      if ((prev[selectedTierId] ?? 0) > 0) return prev;
      return { ...prev, [selectedTierId]: 1 };
    });
  }, [selectedTierId, event.tiers]);

  const chosen = event.tiers.filter((t) => t.status !== 'sold_out' && (qty[t.id] ?? 0) > 0);
  const total = chosen.reduce((sum, t) => sum + t.price * (qty[t.id] ?? 0), 0);
  const count = chosen.reduce((n, t) => n + (qty[t.id] ?? 0), 0);

  const add = () => {
    chosen.forEach((t) => addToCart(event.id, t.id, qty[t.id] ?? 0));
    setQty({});
    setCartOpen(true);
  };

  return (
    <section className="stub" id="entradas" data-accent={event.accent} aria-labelledby="stub-title">
      <header className="stub__head">
        <div>
          <span className="stub__eyebrow">TAQUILLA SINCRONIZADA CON PLANO</span>
          <h2 id="stub-title" className="stub__title">Entradas</h2>
        </div>
        <p className="stub__demo">Demostración</p>
      </header>

      <ul className="tiers">
        {event.tiers.map((t, idx) => {
          const soldOut = t.status === 'sold_out';
          const active = selectedTierId === t.id || (qty[t.id] ?? 0) > 0;
          return (
            <li
              key={t.id}
              className={`tier ${soldOut ? 'is-soldout' : ''} ${active ? 'is-active' : ''}`}
              onClick={() => {
                if (!soldOut) onSelectTier?.(t.id);
              }}
            >
              <div className="tier__info">
                <p className="tier__name">
                  <span className="tier__num">0{idx + 1}</span> {t.name}
                </p>
                <p className="tier__note">{soldOut ? 'Agotada' : t.note}</p>
                <div className="tier__bar" aria-hidden="true">
                  <span
                    className={`tier__bar-fill ${t.status === 'few' ? 'is-few' : ''}`}
                    style={{ width: `${t.remaining}%` }}
                  />
                </div>
                <p className="tier__cap">
                  {soldOut ? '0% disponible' : `Aforo libre: ${t.remaining}%`}
                  {t.status === 'few' && <b> · ÚLTIMOS LOTES</b>}
                </p>
              </div>
              <p className="tier__price">{formatPrice(t.price)}</p>
              {soldOut ? (
                <span className="tier__flag">Agotado</span>
              ) : (
                <Stepper
                  value={qty[t.id] ?? 0}
                  max={MAX_PER_TIER}
                  onChange={(v) => {
                    onSelectTier?.(t.id);
                    setQty((q) => ({ ...q, [t.id]: v }));
                  }}
                  label={`${t.name} de ${event.title}`}
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className="stub__perf" aria-hidden="true" />

      <div className="stub__foot">
        <div className="stub__total">
          <span>{count > 0 ? `${count} ${count === 1 ? 'entrada' : 'entradas'}` : 'Elige tus entradas'}</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <button type="button" className="btn btn--solid btn--block" disabled={count === 0} onClick={add}>
          {firstAvailable ? 'Agregar al carrito' : 'Entradas agotadas'} <Icon name="arrow-right" size={18} />
        </button>
        <p className="stub__fine">
          Sin cargos ocultos: puedes emitir tu pase digital con QR desde el carrito o desde la ficha rápida.
        </p>
      </div>
    </section>
  );
}

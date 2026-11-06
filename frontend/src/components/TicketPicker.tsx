import { useEffect, useState, type FormEvent } from 'react';
import type { AforoEvent } from '../data/events';
import type { DemoUserTicket } from '../data/editorial';
import { MAX_PER_TIER } from '../lib/cart';
import { dayParts, formatPrice, formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { Icon } from './Icon';
import { Stepper } from './Stepper';

interface TicketPickerProps {
  event: AforoEvent;
  selectedTierId?: string;
  onSelectTier?: (tierId: string) => void;
}

/**
 * Estación de selección de sectores y compra en página completa (/eventos/:slug#entradas).
 * Reutiliza e integra los mejores elementos de TicketPicker (talón troquelado de Claude)
 * y de EventQuickModal (desglose de selección, titular demo y emisión de pase QR de Gemini).
 */
export function TicketPicker({ event, selectedTierId, onSelectTier }: TicketPickerProps) {
  const { addToCart, setCartOpen, addDemoTicket, setTicketsOpen } = useStore();
  const firstAvailable = event.tiers.find((t) => t.status !== 'sold_out');
  const [qty, setQty] = useState<Record<string, number>>(() =>
    firstAvailable ? { [firstAvailable.id]: 1 } : {},
  );
  const [holderName, setHolderName] = useState<string>('VALERIA MENDOZA · DEMO');
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  useEffect(() => {
    const first = event.tiers.find((t) => t.status !== 'sold_out');
    setQty(first ? { [first.id]: 1 } : {});
    setCreatedBanner(null);
  }, [event.id, event.tiers]);

  // Cuando el usuario selecciona un sector en el plano SVG, garantizamos al menos 1 entrada activa en ese sector
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

  const handleAddToCart = () => {
    if (count === 0) return;
    chosen.forEach((t) => addToCart(event.id, t.id, qty[t.id] ?? 0));
    setCreatedBanner(null);
    setCartOpen(true);
  };

  const handleEmitDemoQr = (e: FormEvent) => {
    e.preventDefault();
    if (count === 0) return;
    const dp = dayParts(event.startsAt);
    const createdIds: string[] = [];

    chosen.forEach((tier) => {
      const tierQty = qty[tier.id] ?? 1;
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const newTicket: DemoUserTicket = {
        ticketId: `AFR-TK-${randomCode}`,
        eventId: event.id,
        eventSlug: event.slug,
        eventTitle: event.title,
        artist: event.artist,
        city: event.city,
        venue: event.venue,
        dateFormatted: `${dp.weekday} ${dp.day} ${dp.month} · ${formatTime(event.startsAt)}`,
        doorsTime: event.doors,
        zoneName: tier.name,
        seatOrAccess: `${tierQty}x LOCALIDAD DEMO · ${tier.name.toUpperCase()}`,
        holderName: holderName.trim() || 'USUARIO DEMO AFORO',
        pricePaid: tier.price * tierQty,
        status: 'ACTIVA_DEMO',
        pulseHash: `PULSO-${event.city.slice(0, 3).toUpperCase()}-${randomCode}-DEMO`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      addDemoTicket(newTicket);
      createdIds.push(newTicket.ticketId);
    });

    setCreatedBanner(
      `Pase DEMO (${createdIds.join(', ')}) generado localmente con estado ACTIVA_DEMO sin cobro ni bloqueo de inventario real.`,
    );
  };

  return (
    <section className="stub" data-accent={event.accent} aria-labelledby="stub-title">
      <header className="stub__head">
        <div>
          <span className="stub__eyebrow">TAQUILLA SINCRONIZADA CON PLANO</span>
          <h2 id="stub-title" className="stub__title">
            Zonas y Entradas
          </h2>
        </div>
        <span className="stub__demo" title="Entorno de simulación sin cobro real">
          MODO DEMO
        </span>
      </header>

      <div className="stub__demo-banner" role="note" aria-label="Aviso de modo demostración">
        <strong>SIMULACIÓN LOCAL (DEMO):</strong> Seleccionar entradas visualmente no bloquea
        inventario real. El bloqueo temporal (TTL) solo ocurrirá al solicitar formalmente una
        reserva ante el backend.
      </div>

      <ul className="tiers" aria-label="Sectores del recinto">
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
                <p className="tier__note">{soldOut ? 'Sector agotado' : t.note}</p>
                <div className="tier__bar" aria-hidden="true">
                  <span
                    className={`tier__bar-fill ${t.status === 'few' ? 'is-few' : ''}`}
                    style={{ width: `${t.remaining}%` }}
                  />
                </div>
                <p className="tier__cap">
                  {soldOut ? '0% disponible (Agotado)' : `Disponibilidad ref.: ${t.remaining}%`}
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

      <div className="stub__rules" aria-label="Condiciones de compra">
        <span>Máx. {MAX_PER_TIER} entradas por sector</span>
        <span>·</span>
        <span>{event.ageRule}</span>
        <span>·</span>
        <span>{event.doors}</span>
      </div>

      <div className="stub__perf" aria-hidden="true" />

      <form className="stub__foot" onSubmit={handleEmitDemoQr}>
        <div className="stub__summary" aria-live="polite">
          <div className="stub__summary-head">
            <span className="stub__eyebrow">RESUMEN DE TU SELECCIÓN (DEMO)</span>
            <span>
              {count > 0
                ? `${count} ${count === 1 ? 'entrada seleccionada' : 'entradas seleccionadas'}`
                : 'Ningún sector activo'}
            </span>
          </div>

          {chosen.length > 0 ? (
            <ul className="stub__summary-list">
              {chosen.map((t) => {
                const n = qty[t.id] ?? 0;
                return (
                  <li key={t.id} className="stub__summary-item">
                    <span>
                      <b>{n}×</b> {t.name} <small>({formatPrice(t.price)} c/u)</small>
                    </span>
                    <strong>{formatPrice(t.price * n)}</strong>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="stub__summary-empty">
              {firstAvailable
                ? 'Haz clic en una zona del plano o usa los controles (+) para elegir tus entradas.'
                : 'Todas las localidades de este evento figuran agotadas.'}
            </p>
          )}

          {firstAvailable && (
            <div className="stub__holder">
              <label htmlFor="picker-holder-input">TITULAR DEL PASE QR (DEMO)</label>
              <input
                id="picker-holder-input"
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Nombre para el pase de demostración"
              />
            </div>
          )}

          <div className="stub__total">
            <span>Total estimado (sin cobro real)</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </div>

        <div className="stub__actions">
          <button
            type="button"
            className="btn btn--solid btn--block"
            disabled={count === 0}
            onClick={handleAddToCart}
          >
            {firstAvailable ? 'Agregar al carrito' : 'Entradas agotadas'}{' '}
            <Icon name="arrow-right" size={18} />
          </button>

          <button
            type="submit"
            className="btn btn--accent btn--block stub__qr-btn"
            disabled={count === 0}
          >
            Emitir pase QR (Demo) <Icon name="ticket" size={18} />
          </button>
        </div>

        {createdBanner && (
          <div className="stub__feedback" role="status" aria-live="polite">
            <p>{createdBanner}</p>
            <button
              type="button"
              className="stub__feedback-btn"
              onClick={() => setTicketsOpen(true)}
            >
              Abrir Mis Entradas (QR) →
            </button>
          </div>
        )}

        <p className="stub__fine">
          Operación en modo <strong>DEMO</strong>: tanto el carrito como la emisión de pases QR (
          <code>ACTIVA_DEMO</code>) se sincronizan entre tus pestañas abiertas sin realizar cobros
          financieros.
        </p>
      </form>
    </section>
  );
}

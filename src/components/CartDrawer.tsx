import { useEffect, useRef, useState } from 'react';
import { Link } from '../router';
import { cartCount, cartTotal, resolveLines } from '../lib/cart';
import { useDialog } from '../lib/hooks';
import { dateLabel, dayParts, formatPrice, formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { Icon } from './Icon';
import { Photo } from './Photo';
import { Stepper } from './Stepper';

export function CartDrawer() {
  const {
    cartOpen,
    setCartOpen,
    lines,
    events,
    eventsState,
    setQty,
    removeFromCart,
    clearCart,
    addDemoTicket,
    setTicketsOpen,
  } = useStore();
  const [notice, setNotice] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const close = () => setCartOpen(false);
  useDialog(ref, cartOpen, close);

  useEffect(() => {
    if (!cartOpen) setNotice(false);
  }, [cartOpen]);

  const ready = eventsState.status === 'ready';
  const resolved = resolveLines(lines, events);
  const unavailable = ready ? lines.filter((l) => !resolved.some((r) => r.line === l)) : [];
  const total = cartTotal(lines, events);
  const count = resolved.reduce((n, r) => n + r.line.qty, 0);

  const issueDemoPasses = () => {
    resolved.forEach(({ line, event, tier }) => {
      const dp = dayParts(event.startsAt);
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      addDemoTicket({
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
        seatOrAccess: `${line.qty}x LOCALIDAD DEMO · ${tier.name.toUpperCase()}`,
        holderName: 'VALERIA MENDOZA · DEMO',
        pricePaid: tier.price * line.qty,
        status: 'ACTIVA_DEMO',
        pulseHash: `PULSO-${event.city.slice(0, 3).toUpperCase()}-${randomCode}-CART`,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    });
    clearCart();
    setNotice(false);
    setCartOpen(false);
    setTicketsOpen(true);
  };

  return (
    <div className="drawer" data-open={cartOpen} aria-hidden={!cartOpen}>
      <div className="drawer__scrim" onClick={close} />
      <aside ref={ref} className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1}>
        <header className="drawer__head">
          <h2 id="cart-title" className="drawer__title">
            Tu carrito <span className="drawer__count">{cartCount(lines)}</span>
          </h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Cerrar carrito">
            <Icon name="close" />
          </button>
        </header>

        <div className="drawer__body">
          {!ready && lines.length > 0 && <p className="drawer__note" role="status">Cargando tus entradas…</p>}

          {ready && lines.length === 0 && (
            <div className="drawer__empty">
              <p className="drawer__empty-big" aria-hidden="true">Vacío</p>
              <p>Aún no has elegido entradas.</p>
              <Link to="/eventos" className="btn btn--solid" onClick={close}>
                Explorar eventos <Icon name="arrow-right" size={18} />
              </Link>
            </div>
          )}

          <ul className="cart-lines">
            {resolved.map(({ line, event, tier }) => (
              <li key={`${line.eventId}:${line.tierId}`} className="cart-line" data-accent={event.accent}>
                <Link to={`/eventos/${event.slug}`} newTab className="cart-line__thumb" onClick={close} aria-label={`Ver ${event.title}`}>
                  <Photo image={event.image} mode="poster" />
                </Link>
                <div className="cart-line__info">
                  <p className="cart-line__date">
                    {dateLabel(event)} · {event.city}
                  </p>
                  <p className="cart-line__title">{event.title}</p>
                  <p className="cart-line__tier">{tier.name} · {formatPrice(tier.price)}</p>
                  <div className="cart-line__ctrl">
                    <Stepper value={line.qty} min={0} onChange={(q) => setQty(line.eventId, line.tierId, q)} label={`${tier.name} de ${event.title}`} />
                    <button type="button" className="link-btn" onClick={() => removeFromCart(line.eventId, line.tierId)}>
                      Quitar
                    </button>
                  </div>
                </div>
                <p className="cart-line__sum">{formatPrice(tier.price * line.qty)}</p>
              </li>
            ))}
          </ul>

          {unavailable.length > 0 && (
            <div className="drawer__note drawer__note--warn" role="status">
              <p>
                {unavailable.length === 1 ? 'Una entrada de tu carrito ya no está disponible.' : `${unavailable.length} entradas de tu carrito ya no están disponibles.`}
              </p>
              <button type="button" className="link-btn" onClick={() => unavailable.forEach((l) => removeFromCart(l.eventId, l.tierId))}>
                Quitar no disponibles
              </button>
            </div>
          )}
        </div>

        {resolved.length > 0 && (
          <footer className="drawer__foot">
            <div className="drawer__sum">
              <span>Subtotal · {count} {count === 1 ? 'entrada' : 'entradas'}</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <p className="drawer__fine">
              <strong>MODO DEMO · Sin bloqueo de inventario:</strong> la selección visual en tu carrito no reserva aforo en servidor. El bloqueo temporal (TTL) solo existirá al conectar el backend transaccional.
            </p>
            <button type="button" className="btn btn--solid btn--block" onClick={() => setNotice(true)}>
              Emitir pases QR (Demo) <Icon name="arrow-right" size={18} />
            </button>
            <button type="button" className="link-btn link-btn--center" onClick={clearCart}>
              Vaciar carrito
            </button>
          </footer>
        )}

        {notice && (
          <div className="drawer__notice" role="alertdialog" aria-labelledby="notice-title" aria-describedby="notice-text">
            <p className="eyebrow">MODO DEMO · ACTIVA_DEMO</p>
            <h3 id="notice-title" className="drawer__notice-title">Emite tus pases digitales de demostración</h3>
            <p id="notice-text">
              Esta versión opera en modo de demostración local sin pasarela de pago ni reserva real de inventario en servidor. Puedes convertir tu carrito en pases digitales simulados (<code>ACTIVA_DEMO</code>) con código QR dentro de «Mis Entradas».
            </p>
            <div className="drawer__notice-actions">
              <button type="button" className="btn btn--solid" onClick={issueDemoPasses} data-autofocus>
                Emitir en Mis Entradas (QR) <Icon name="arrow-right" size={18} />
              </button>
              <button type="button" className="link-btn" onClick={() => setNotice(false)}>
                Seguir revisando carrito
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

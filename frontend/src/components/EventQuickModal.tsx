import { useEffect, useRef, useState } from 'react';
import type { AforoEvent, TicketTier } from '../data/events';
import type { DemoUserTicket } from '../data/editorial';
import { Link } from '../router';
import { genreLabel, isSoldOut } from '../lib/filters';
import { dayParts, formatLongDate, formatPrice, formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { saleBadgeClass } from './EventCard';
import { Icon } from './Icon';
import { Photo } from './Photo';
import { VenueStageMap } from './VenueStageMap';

/**
 * Ventana modal «Ficha Editorial & Plano de Sectores» (referencia de Gemini),
 * adaptada a la paleta por evento de Claude y conectada tanto al carrito lateral
 * como a la billetera local «Mis Entradas» con código QR.
 *
 * Implementa `<dialog closedby="any">` abierto con `showModal()` y el fallback
 * de light-dismiss por coordenadas cuando el navegador no soporta `closedBy`.
 */
export function EventQuickModal() {
  const {
    quickEvent: event,
    closeQuickEvent: onClose,
    addToCart,
    setCartOpen,
    addDemoTicket,
    setTicketsOpen,
  } = useStore();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [holderName, setHolderName] = useState<string>('VALERIA MENDOZA · DEMO');
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (event) {
      const firstAvailable = event.tiers.find((t) => t.status !== 'sold_out') ?? event.tiers[0];
      setSelectedTierId(firstAvailable ? firstAvailable.id : '');
      setQuantity(1);
      setCreatedBanner(null);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [event]);

  // Fallback para navegadores sin soporte nativo de `HTMLDialogElement.prototype.closedBy`
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);

    const handleClick = (e: MouseEvent) => {
      if ('closedBy' in HTMLDialogElement.prototype) return;
      if (e.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isDialogContent) dialog.close();
    };
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  const selectedTier: TicketTier | undefined = event?.tiers.find((t) => t.id === selectedTierId);
  const canBook = Boolean(event && selectedTier && selectedTier.status !== 'sold_out' && !isSoldOut(event));

  const handleAddToCart = () => {
    if (!event || !selectedTier || !canBook) return;
    addToCart(event.id, selectedTier.id, quantity);
    onClose();
    setCartOpen(true);
  };

  const handleGenerateDemoPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !selectedTier || !canBook) return;

    const dp = dayParts(event.startsAt);
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
      zoneName: selectedTier.name,
      seatOrAccess: `${quantity}x LOCALIDAD DEMO · ${selectedTier.name.toUpperCase()}`,
      holderName: holderName.trim() || 'USUARIO DEMO AFORO',
      pricePaid: selectedTier.price * quantity,
      status: 'ACTIVA_DEMO',
      pulseHash: `PULSO-${event.city.slice(0, 3).toUpperCase()}-${randomCode}-DEMO`,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    addDemoTicket(newTicket);
    setCreatedBanner(
      `Pase ${newTicket.ticketId} emitido en "Mis Entradas" (demostración local con código QR).`,
    );
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, unknown>)}
      className="aforo-dialog"
      data-accent={event?.accent ?? 'orange'}
      aria-labelledby="event-modal-title"
    >
      {event && (
        <div className="aforo-modal">
          <div className="aforo-modal__topbar">
            <div className="aforo-modal__topbar-meta">
              <span className="aforo-mono-tag">FICHA EDITORIAL & PLANO DE SECTORES</span>
              <span className="aforo-mono-muted">{event.code} · ESCENARIO DEMO</span>
            </div>
            <div className="aforo-modal__topbar-actions">
              <Link
                to={`/eventos/${event.slug}`}
                onClick={onClose}
                className="aforo-modal__page-link"
              >
                <span>Ver página completa del concierto</span>
                <Icon name="arrow-up-right" size={14} />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="aforo-modal__close"
                aria-label="Cerrar ficha del evento"
              >
                <span>CERRAR [ESC]</span>
              </button>
            </div>
          </div>

          <div className="aforo-modal__content">
            {/* Columna izquierda: Dossier editorial del evento */}
            <div className="aforo-modal__dossier">
              <div className="aforo-modal__media">
                <Photo image={event.image} mode="photo" duotone className="aforo-modal__img" />
                <div className="aforo-modal__media-badges">
                  <span className={`aforo-badge ${saleBadgeClass(event.sale)}`}>
                    {event.saleLabel}
                  </span>
                  <span className="aforo-badge aforo-badge--neutral">
                    {genreLabel(event.genre).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="aforo-modal__info">
                <p className="aforo-modal__artist">{event.artist}</p>
                <h2 id="event-modal-title" className="aforo-modal__title">
                  {event.title}
                </h2>
                <p className="aforo-modal__kicker">{event.kicker}</p>
                <p className="aforo-modal__synopsis">{event.description.join(' ')}</p>

                <div className="aforo-modal__specs">
                  <div className="aforo-modal__spec-item">
                    <span className="aforo-modal__spec-label">FECHA Y HORA</span>
                    <strong className="aforo-modal__spec-val">
                      {formatLongDate(event.startsAt)} · {formatTime(event.startsAt)} ({event.doors})
                    </strong>
                  </div>
                  <div className="aforo-modal__spec-item">
                    <span className="aforo-modal__spec-label">RECINTO & CIUDAD</span>
                    <strong className="aforo-modal__spec-val">
                      {event.venue} · {event.district}, {event.city}
                    </strong>
                  </div>
                  <div className="aforo-modal__spec-item">
                    <span className="aforo-modal__spec-label">COORDENADAS</span>
                    <strong className="aforo-modal__spec-val">{event.coordinates}</strong>
                  </div>
                  <div className="aforo-modal__spec-item">
                    <span className="aforo-modal__spec-label">INGRESO</span>
                    <strong className="aforo-modal__spec-val">{event.ageRule}</strong>
                  </div>
                </div>

                <div className="aforo-modal__lineup-box">
                  <span className="aforo-modal__spec-label">CARTEL / LINE-UP CONFIRMADO EN FICHA</span>
                  <div className="aforo-modal__lineup-tags">
                    {event.lineup.map((act) => (
                      <span key={act.name} className="aforo-modal__lineup-pill">
                        {act.name}
                        {act.time ? <small> · {act.time}</small> : null}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="aforo-modal__acoustic-box">
                  <span className="aforo-modal__spec-label">ESPECIFICACIÓN TÉCNICA DE SALA</span>
                  <p>{event.acoustic}</p>
                </div>
              </div>
            </div>

            {/* Columna derecha: Plano acústico SVG + distribución de sectores y compra */}
            <div className="aforo-modal__zones-panel">
              <VenueStageMap
                event={event}
                selectedTierId={selectedTierId}
                onSelectTier={setSelectedTierId}
              />

              <h3 className="aforo-modal__zones-heading">DISTRIBUCIÓN DE SECTORES Y PRECIOS</h3>

              <div className="aforo-modal__zones-list" role="radiogroup" aria-label="Zonas del evento">
                {event.tiers.map((tier) => {
                  const isSelected = tier.id === selectedTierId;
                  const isTierSoldOut = tier.status === 'sold_out';

                  return (
                    <label
                      key={tier.id}
                      className={`aforo-zone-item ${isSelected ? 'is-selected' : ''} ${
                        isTierSoldOut ? 'is-disabled' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="event-zone"
                        value={tier.id}
                        disabled={isTierSoldOut}
                        checked={isSelected}
                        onChange={() => setSelectedTierId(tier.id)}
                      />
                      <div className="aforo-zone-item__main">
                        <div className="aforo-zone-item__top">
                          <span className="aforo-zone-item__name">{tier.name}</span>
                          <span className="aforo-zone-item__price">{formatPrice(tier.price)}</span>
                        </div>
                        <p className="aforo-zone-item__desc">{tier.note}</p>
                        <div className="aforo-zone-item__bar-wrap">
                          <div
                            className="aforo-zone-item__bar-fill"
                            style={{ width: `${tier.remaining}%` }}
                          />
                        </div>
                        <div className="aforo-zone-item__meta">
                          <span>
                            {isTierSoldOut
                              ? 'SECTOR AGOTADO'
                              : `Disponibilidad referencial: ${tier.remaining}%`}
                          </span>
                          <span className="aforo-zone-item__status">
                            {tier.status === 'sold_out'
                              ? 'AGOTADO'
                              : tier.status === 'few'
                              ? 'ÚLTIMOS'
                              : 'DISPONIBLE'}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {canBook && selectedTier ? (
                <form className="aforo-modal__simulator" onSubmit={handleGenerateDemoPass}>
                  <div className="aforo-modal__sim-row">
                    <div className="aforo-modal__sim-field">
                      <label htmlFor="sim-quantity">CANTIDAD (MÁX. 4)</label>
                      <div className="aforo-qty-stepper">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          aria-label="Disminuir cantidad"
                        >
                          −
                        </button>
                        <input
                          id="sim-quantity"
                          type="number"
                          min={1}
                          max={4}
                          readOnly
                          value={quantity}
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.min(4, q + 1))}
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="aforo-modal__sim-field aforo-modal__sim-field--grow">
                      <label htmlFor="sim-holder">TITULAR DEL PASE DEMO</label>
                      <input
                        id="sim-holder"
                        type="text"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        className="aforo-modal__sim-input"
                      />
                    </div>
                  </div>

                  <div className="aforo-modal__sim-summary">
                    <div>
                      <span className="aforo-mono-muted">TOTAL ESTIMADO</span>
                      <strong className="aforo-modal__sim-total">
                        {formatPrice(selectedTier.price * quantity)}
                      </strong>
                    </div>
                    <div className="aforo-modal__sim-buttons">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="aforo-cta-secondary"
                      >
                        <span>Agregar al carrito</span>
                      </button>
                      <button type="submit" className="aforo-cta-primary">
                        <span>Emitir pase QR (Demo)</span>
                      </button>
                    </div>
                  </div>

                  {createdBanner && (
                    <div className="aforo-modal__sim-feedback" role="status" aria-live="polite">
                      <span>{createdBanner}</span>
                      <button
                        type="button"
                        className="aforo-link-reset"
                        onClick={() => {
                          onClose();
                          setTicketsOpen(true);
                        }}
                      >
                        Abrir Mis Entradas →
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="aforo-modal__soldout-box">
                  <p>
                    Este escenario de demostración figura con aforo completo. Puedes explorar
                    otras fechas activas en la cartelera.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

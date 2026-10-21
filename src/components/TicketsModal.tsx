import { useEffect, useRef, useState } from 'react';
import { Link } from '../router';
import { formatPrice } from '../lib/format';
import { useStore } from '../lib/store';

/**
 * Billetera local «Mis Entradas» con código QR verificable (de Gemini),
 * usando `<dialog closedby="any">` y fallback de light-dismiss.
 */
export function TicketsModal() {
  const { ticketsOpen: isOpen, setTicketsOpen, tickets, removeDemoTicket } = useStore();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ticketQuery, setTicketQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const onClose = () => setTicketsOpen(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (tickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(tickets[0]?.ticketId ?? null);
      }
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, tickets, selectedTicketId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => setTicketsOpen(false);
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
  }, [setTicketsOpen]);

  const filteredTickets = tickets.filter((tk) => {
    const q = ticketQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      tk.ticketId.toLowerCase().includes(q) ||
      tk.eventTitle.toLowerCase().includes(q) ||
      tk.city.toLowerCase().includes(q) ||
      tk.pulseHash.toLowerCase().includes(q)
    );
  });

  const activeTicket =
    filteredTickets.find((t) => t.ticketId === selectedTicketId) ?? filteredTickets[0];

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, unknown>)}
      className="aforo-dialog"
      aria-labelledby="tickets-modal-title"
    >
      <div className="aforo-modal aforo-modal--tickets">
        <div className="aforo-modal__topbar">
          <div className="aforo-modal__topbar-meta">
            <span className="aforo-mono-tag">BILLETERA DE ENTRADAS · AFORO FUSION</span>
            <span className="aforo-mono-muted">PASES DIGITALES CON QR (DEMO LOCAL)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="aforo-modal__close"
            aria-label="Cerrar consulta de entradas"
          >
            <span>CERRAR [ESC]</span>
          </button>
        </div>

        <div className="aforo-tickets-view">
          <div className="aforo-tickets-view__sidebar">
            <div className="aforo-tickets-view__search">
              <label htmlFor="ticket-lookup-input" className="aforo-control-group__label">
                BUSCAR POR CÓDIGO, EVENTO O CIUDAD
              </label>
              <input
                id="ticket-lookup-input"
                type="search"
                value={ticketQuery}
                onChange={(e) => setTicketQuery(e.target.value)}
                placeholder="Ej. AFR-TK-9042, Cusco, Lima..."
                className="aforo-modal__sim-input"
              />
            </div>

            <div
              className="aforo-tickets-view__list"
              role="listbox"
              aria-label="Lista de pases de demostración"
            >
              {filteredTickets.length === 0 ? (
                <div className="aforo-tickets-view__empty">
                  <p>No se encontraron entradas con ese criterio.</p>
                </div>
              ) : (
                filteredTickets.map((tk) => {
                  const isCurrent = activeTicket?.ticketId === tk.ticketId;
                  return (
                    <button
                      key={tk.ticketId}
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => setSelectedTicketId(tk.ticketId)}
                      className={`aforo-ticket-stub ${isCurrent ? 'is-active' : ''}`}
                    >
                      <div className="aforo-ticket-stub__top">
                        <span className="aforo-ticket-stub__code">{tk.ticketId}</span>
                        <span className="aforo-ticket-stub__city">{tk.city.toUpperCase()}</span>
                      </div>
                      <strong className="aforo-ticket-stub__title">{tk.eventTitle}</strong>
                      <span className="aforo-ticket-stub__meta">
                        {tk.dateFormatted} · {tk.zoneName}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="aforo-tickets-view__detail">
            <h2 id="tickets-modal-title" className="sr-only">
              Mis Entradas en AFORO
            </h2>
            {activeTicket ? (
              <div className="aforo-pass-card">
                <div className="aforo-pass-card__header">
                  <div>
                    <span className="aforo-badge aforo-badge--lime">
                      PASE DEMOSTRATIVO LOCAL · {activeTicket.status}
                    </span>
                    <p className="aforo-pass-card__id">{activeTicket.ticketId}</p>
                  </div>
                  <div className="aforo-pass-card__brand">AFORO // ACCESS</div>
                </div>

                <div className="aforo-pass-card__body">
                  <p className="aforo-pass-card__artist">{activeTicket.artist}</p>
                  <h3 className="aforo-pass-card__title">{activeTicket.eventTitle}</h3>

                  <div className="aforo-pass-card__grid">
                    <div>
                      <span>CIUDAD / RECINTO</span>
                      <strong>
                        {activeTicket.city} — {activeTicket.venue}
                      </strong>
                    </div>
                    <div>
                      <span>FECHA Y PUERTAS</span>
                      <strong>
                        {activeTicket.dateFormatted} ({activeTicket.doorsTime})
                      </strong>
                    </div>
                    <div>
                      <span>SECTOR / ZONA</span>
                      <strong>{activeTicket.zoneName}</strong>
                    </div>
                    <div>
                      <span>TITULAR REGISTRADO</span>
                      <strong>{activeTicket.holderName}</strong>
                    </div>
                  </div>
                </div>

                <div className="aforo-pass-card__perforation" aria-hidden="true" />

                <div className="aforo-pass-card__qr-section">
                  <div className="aforo-pass-card__qr-box" aria-label="Código QR de demostración">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 120 120"
                      className="aforo-pass-card__qr-svg"
                    >
                      <rect width="120" height="120" fill="#F4F0E8" />
                      <rect x="10" y="10" width="30" height="30" fill="#101114" />
                      <rect x="16" y="16" width="18" height="18" fill="#F4F0E8" />
                      <rect x="20" y="20" width="10" height="10" fill="#FF5538" />

                      <rect x="80" y="10" width="30" height="30" fill="#101114" />
                      <rect x="86" y="16" width="18" height="18" fill="#F4F0E8" />
                      <rect x="90" y="20" width="10" height="10" fill="#101114" />

                      <rect x="10" y="80" width="30" height="30" fill="#101114" />
                      <rect x="16" y="86" width="18" height="18" fill="#F4F0E8" />
                      <rect x="20" y="90" width="10" height="10" fill="#101114" />

                      <rect x="48" y="14" width="8" height="8" fill="#101114" />
                      <rect x="62" y="14" width="8" height="16" fill="#101114" />
                      <rect x="48" y="30" width="16" height="8" fill="#101114" />
                      <rect x="14" y="48" width="16" height="8" fill="#101114" />
                      <rect x="38" y="48" width="24" height="12" fill="#101114" />
                      <rect x="70" y="48" width="12" height="20" fill="#FF5538" />
                      <rect x="90" y="48" width="20" height="8" fill="#101114" />
                      <rect x="48" y="68" width="14" height="14" fill="#101114" />
                      <rect x="72" y="76" width="20" height="8" fill="#101114" />
                      <rect x="52" y="92" width="16" height="18" fill="#101114" />
                      <rect x="76" y="92" width="12" height="18" fill="#101114" />
                      <rect x="96" y="84" width="14" height="26" fill="#101114" />
                    </svg>
                  </div>

                  <div className="aforo-pass-card__qr-meta">
                    <span className="aforo-mono-tag">TOKEN DE PULSO (OFFLINE DEMO)</span>
                    <code className="aforo-pass-card__hash">{activeTicket.pulseHash}</code>
                    <p>
                      Este código QR pertenece al entorno de demostración local de AFORO Fusion (<code>{activeTicket.status}</code>). No representa una reserva de inventario en servidor ni es válido para ingreso físico en recintos reales.
                    </p>
                    <div className="aforo-pass-card__actions">
                      <span className="aforo-pass-card__price">
                        Importe ref.: {formatPrice(activeTicket.pricePaid)}
                      </span>
                      <div className="aforo-pass-card__links">
                        <Link
                          to={`/eventos/${activeTicket.eventSlug}`}
                          newTab
                          onClick={onClose}
                          className="aforo-link-reset"
                        >
                          Ver evento →
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeDemoTicket(activeTicket.ticketId)}
                          className="aforo-link-reset"
                        >
                          Eliminar pase ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aforo-state-panel">
                <h3 className="aforo-state-panel__title">Sin entradas seleccionadas</h3>
                <p className="aforo-state-panel__desc">
                  Puedes generar un pase de demostración desde cualquier evento disponible en la
                  cartelera o desde tu carrito.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

import type { AforoEvent } from '../data/events';
import { Link } from '../router';
import { genreLabel, isSoldOut, minPrice } from '../lib/filters';
import { dateLabel, dayParts, formatPrice, formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { Icon } from './Icon';
import { Photo } from './Photo';

export function SaveButton({ event, className = '' }: { event: AforoEvent; className?: string }) {
  const { saved, toggleSaved } = useStore();
  const on = saved.has(event.id);
  return (
    <button
      type="button"
      className={`save ${on ? 'is-on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? `Quitar ${event.title} de guardados` : `Guardar ${event.title}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleSaved(event.id);
      }}
    >
      <Icon name={on ? 'heart-filled' : 'heart'} size={18} />
    </button>
  );
}

export function priceLine(event: AforoEvent): string {
  return isSoldOut(event) ? 'Entradas agotadas' : `Desde ${formatPrice(minPrice(event))}`;
}

export function saleBadgeClass(sale: AforoEvent['sale']): string {
  switch (sale) {
    case 'ultimos':
      return 'aforo-badge--orange';
    case 'preventa':
      return 'aforo-badge--lime';
    case 'agotado':
      return 'aforo-badge--muted';
    default:
      return 'aforo-badge--neutral';
  }
}

/**
 * Tarjeta vertical tipo cartel (usada en Explorar `/eventos`).
 * Combina el póster ilustrado con siluetas y sello de fecha inclinado de Claude
 * con las etiquetas de estado y código técnico monoespaciado de Gemini.
 */
export function PosterCard({ event, eager }: { event: AforoEvent; eager?: boolean }) {
  const dp = dayParts(event.startsAt);
  const soldOut = isSoldOut(event);
  return (
    <article className="poster" data-accent={event.accent}>
      <Link to={`/eventos/${event.slug}`} className="poster__link">
        <div className="poster__media">
          <Photo image={event.image} mode="poster" eager={eager} />
          <span className="poster__date">
            <b>{dateLabel(event)}</b>
            <small>{dp.weekday}</small>
          </span>
          <span className={`poster__status aforo-badge ${saleBadgeClass(event.sale)}`}>
            {event.saleLabel}
          </span>
          {soldOut && <span className="poster__flag">Agotado</span>}
        </div>
        <div className="poster__body">
          <p className="poster__meta">
            <b>{event.city}</b> <span>{genreLabel(event.genre)}</span>
            <small className="poster__code">{event.code}</small>
          </p>
          <h3 className="poster__title">{event.title}</h3>
          <p className="poster__artist">{event.artist}</p>
          <p className="poster__price">
            {priceLine(event)}
            <Icon name="arrow-right" size={18} />
          </p>
        </div>
      </Link>
      <SaveButton event={event} className="poster__save" />
    </article>
  );
}

/** Fila horizontal para la vista de lista en Explorar. */
export function RowCard({ event }: { event: AforoEvent }) {
  const dp = dayParts(event.startsAt);
  return (
    <article className="rowcard" data-accent={event.accent}>
      <Link to={`/eventos/${event.slug}`} className="rowcard__link">
        <div className="rowcard__media">
          <Photo image={event.image} mode="poster" />
        </div>
        <div className="rowcard__date">
          <b>{dateLabel(event)}</b>
          <small>
            {dp.weekday} · {formatTime(event.startsAt)}
          </small>
        </div>
        <div className="rowcard__main">
          <span className="rowcard__artist">{event.artist}</span>
          <h3 className="rowcard__title">{event.title}</h3>
          <p className="rowcard__meta">
            {event.venue} · {event.city} · {genreLabel(event.genre)}
          </p>
        </div>
        <p className="rowcard__price">
          {priceLine(event)}
          <Icon name="arrow-right" size={18} />
        </p>
      </Link>
      <SaveButton event={event} className="rowcard__save" />
    </article>
  );
}

/**
 * Tarjeta editorial horizontal/asimétrica (usada en «Programación en pulso» y «Otros conciertos»).
 * Integra la estructura rica de Gemini (fotografía real, píldoras de sectores, artista en coral,
 * índice grande) con el sello de fecha inclinado y el color de acento por evento de Claude.
 */
export function EditorialCard({
  event,
  index,
  variant = 'standard',
  onQuickOpen,
}: {
  event: AforoEvent;
  index: number;
  variant?: 'featured-xl' | 'editorial-wide' | 'poster-tall' | 'standard';
  onQuickOpen?: (event: AforoEvent) => void;
}) {
  const soldOut = isSoldOut(event);
  const dp = dayParts(event.startsAt);
  const lowest = minPrice(event);

  return (
    <article
      className={`aforo-event-card aforo-event-card--${variant} ${soldOut ? 'is-sold-out' : ''}`}
      data-accent={event.accent}
    >
      <div className="aforo-event-card__media">
        <Photo image={event.image} mode="photo" duotone className="aforo-event-card__img" />
        <div className="aforo-event-card__scrim" aria-hidden="true" />

        <div className="aforo-event-card__top-badges">
          <span className={`aforo-badge ${saleBadgeClass(event.sale)}`}>{event.saleLabel}</span>
          <span className="aforo-event-card__city-tag">
            {event.city.toUpperCase()} · {event.district}
          </span>
        </div>

        {/* Sello de fecha girado de Claude integrado en la esquina inferior izquierda */}
        <span className="aforo-event-card__date-stamp" aria-hidden="true">
          <b>{dateLabel(event)}</b>
          <small>
            {dp.weekday} · {formatTime(event.startsAt)}
          </small>
        </span>

        <div className="aforo-event-card__index-mark" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </div>

        <SaveButton event={event} className="aforo-event-card__save" />
      </div>

      <div className="aforo-event-card__body">
        <div className="aforo-event-card__meta-row">
          <span className="aforo-event-card__date">
            {dp.weekday} {dateLabel(event)} · {formatTime(event.startsAt)}
          </span>
          <span className="aforo-event-card__code">{event.editorialTag}</span>
        </div>

        <p className="aforo-event-card__artist">{event.artist}</p>

        <h3 className="aforo-event-card__title">
          <Link to={`/eventos/${event.slug}`} className="aforo-event-card__title-link">
            {event.title}
          </Link>
        </h3>

        <p className="aforo-event-card__venue">
          <Icon name="pin" size={14} className="aforo-event-card__venue-icon" />
          <span>
            {event.venue} · {event.city}
          </span>
        </p>

        <p className="aforo-event-card__synopsis">{event.description[0]}</p>

        {/* Píldoras de sectores con precios y tachado si están agotados */}
        <div className="aforo-event-card__zones-preview" aria-label="Sectores del evento">
          {event.tiers.map((t) => (
            <span
              key={t.id}
              className={`aforo-zone-chip ${t.status === 'sold_out' ? 'is-soldout' : ''}`}
            >
              {t.name}: <strong>{formatPrice(t.price)}</strong>
            </span>
          ))}
        </div>

        <div className="aforo-event-card__footer">
          <div className="aforo-event-card__pricing">
            <span className="aforo-event-card__price-label">
              {soldOut ? 'REFERENCIA' : 'DESDE'}
            </span>
            <span className="aforo-event-card__price-value">{formatPrice(lowest)}</span>
          </div>

          <div className="aforo-event-card__actions">
            {onQuickOpen && (
              <button
                type="button"
                onClick={() => onQuickOpen(event)}
                className={`aforo-event-card__cta ${soldOut ? 'aforo-event-card__cta--muted' : ''}`}
              >
                <span>{soldOut ? 'Ficha y plano' : 'Plano y entradas'}</span>
                <Icon name="arrow-right" size={15} />
              </button>
            )}
            <Link to={`/eventos/${event.slug}`} className="aforo-event-card__detail-link">
              <span>Ver concierto</span>
              <Icon name="arrow-up-right" size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

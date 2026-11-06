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
 * Ofrece acciones diferenciadas en nueva pestaña segura:
 * - Ver evento -> `/eventos/:slug`
 * - Comprar / Entradas -> `/eventos/:slug#entradas`
 */
export function PosterCard({ event, eager }: { event: AforoEvent; eager?: boolean }) {
  const dp = dayParts(event.startsAt);
  const soldOut = isSoldOut(event);
  return (
    <article className="poster" data-accent={event.accent}>
      <Link
        to={`/eventos/${event.slug}`}
        newTab
        className="poster__link"
        aria-label={`Ver evento ${event.title}`}
      >
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
      </Link>
      <div className="poster__body">
        <p className="poster__meta">
          <b>{event.city}</b> <span>{genreLabel(event.genre)}</span>
          <small className="poster__code">{event.code}</small>
        </p>
        <h3 className="poster__title">
          <Link to={`/eventos/${event.slug}`} newTab className="poster__title-link">
            {event.title}
          </Link>
        </h3>
        <p className="poster__artist">{event.artist}</p>
        <div className="poster__price">
          <span className="poster__price-label">{priceLine(event)}</span>
          <span className="poster__actions">
            <Link
              to={`/eventos/${event.slug}`}
              newTab
              className="poster__act"
              aria-label={`Ver ficha de ${event.title}`}
            >
              Ver evento
            </Link>
            <Link
              to={`/eventos/${event.slug}#entradas`}
              newTab
              className="poster__act poster__act--buy"
              aria-label={`Comprar o ver entradas para ${event.title}`}
            >
              {soldOut ? 'Plano' : 'Entradas'} <Icon name="arrow-up-right" size={14} />
            </Link>
          </span>
        </div>
      </div>
      <SaveButton event={event} className="poster__save" />
    </article>
  );
}

/** Fila horizontal para la vista de lista en Explorar. */
export function RowCard({ event }: { event: AforoEvent }) {
  const dp = dayParts(event.startsAt);
  const soldOut = isSoldOut(event);
  return (
    <article className="rowcard" data-accent={event.accent}>
      <div className="rowcard__link">
        <Link
          to={`/eventos/${event.slug}`}
          newTab
          className="rowcard__media"
          aria-label={`Ver evento ${event.title}`}
        >
          <Photo image={event.image} mode="poster" />
        </Link>
        <div className="rowcard__date">
          <b>{dateLabel(event)}</b>
          <small>
            {dp.weekday} · {formatTime(event.startsAt)}
          </small>
        </div>
        <div className="rowcard__main">
          <span className="rowcard__artist">{event.artist}</span>
          <h3 className="rowcard__title">
            <Link to={`/eventos/${event.slug}`} newTab className="rowcard__title-link">
              {event.title}
            </Link>
          </h3>
          <p className="rowcard__meta">
            {event.venue} · {event.city} · {genreLabel(event.genre)}
          </p>
        </div>
        <div className="rowcard__price">
          <span className="rowcard__price-label">{priceLine(event)}</span>
          <span className="rowcard__actions">
            <Link to={`/eventos/${event.slug}`} newTab className="rowcard__act">
              Ver evento
            </Link>
            <Link
              to={`/eventos/${event.slug}#entradas`}
              newTab
              className="rowcard__act rowcard__act--buy"
            >
              {soldOut ? 'Ficha y plano' : 'Ver entradas'} <Icon name="arrow-up-right" size={15} />
            </Link>
          </span>
        </div>
      </div>
      <SaveButton event={event} className="rowcard__save" />
    </article>
  );
}

/**
 * Tarjeta editorial horizontal/asimétrica (usada en «Programación en pulso» y «Otros conciertos»).
 * Abre en nueva pestaña segura tanto la ficha general (/eventos/:slug) como la sección de entradas (/eventos/:slug#entradas).
 */
export function EditorialCard({
  event,
  index,
  variant = 'standard',
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
          <Link to={`/eventos/${event.slug}`} newTab className="aforo-event-card__title-link">
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
            <Link
              to={`/eventos/${event.slug}#entradas`}
              newTab
              className={`aforo-event-card__cta ${soldOut ? 'aforo-event-card__cta--muted' : ''}`}
            >
              <span>{soldOut ? 'Ficha y plano' : 'Comprar entradas'}</span>
              <Icon name="arrow-right" size={15} />
            </Link>
            <Link
              to={`/eventos/${event.slug}`}
              newTab
              className="aforo-event-card__detail-link"
            >
              <span>Ver el evento</span>
              <Icon name="arrow-up-right" size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

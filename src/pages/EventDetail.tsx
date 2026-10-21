import { useEffect, useState, type MouseEvent } from 'react';
import { Link } from '../router';
import { Icon } from '../components/Icon';
import { EditorialCard, SaveButton, saleBadgeClass } from '../components/EventCard';
import { Photo } from '../components/Photo';
import { Marquee } from '../components/Marquee';
import { ErrorState } from '../components/States';
import { TicketPicker } from '../components/TicketPicker';
import { VenueStageMap } from '../components/VenueStageMap';
import { useDocumentTitle } from '../lib/hooks';
import { DEFAULT_FILTERS, filterEvents, genreLabel, isSoldOut, minPrice } from '../lib/filters';
import { dayParts, formatLongDate, formatPrice, formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { NotFound } from './NotFound';

export function EventDetail({ slug }: { slug: string }) {
  const { eventsState, events, now, reload, openQuickEvent } = useStore();
  const event = events.find((e) => e.slug === slug);
  useDocumentTitle(event ? `${event.title} — ${event.city} · AFORO` : 'AFORO');

  const [selectedTierId, setSelectedTierId] = useState<string>('');

  useEffect(() => {
    if (!event) return;
    const firstAvailable = event.tiers.find((t) => t.status !== 'sold_out') ?? event.tiers[0];
    setSelectedTierId(firstAvailable ? firstAvailable.id : '');
  }, [event]);

  if (eventsState.status === 'loading') return <DetailSkeleton />;
  if (eventsState.status === 'error') {
    return (
      <div className="wrap section">
        <ErrorState onRetry={reload} message={eventsState.message} />
      </div>
    );
  }
  if (!event) {
    return (
      <NotFound
        title="Ese evento no existe"
        text="Puede que el enlace esté mal escrito o que el evento ya haya terminado."
      />
    );
  }

  const dp = dayParts(event.startsAt);
  const more = filterEvents(events, DEFAULT_FILTERS, now)
    .filter((e) => e.id !== event.id)
    .sort(
      (a, b) =>
        Number(b.genre === event.genre) - Number(a.genre === event.genre) ||
        Number(b.city === event.city) - Number(a.city === event.city),
    )
    .slice(0, 4);

  return (
    <article className="detail" data-accent={event.accent}>
      {/* Cabecera a pantalla completa de Claude: póster ilustrado, título gigante, cursiva lima y sello girado */}
      <header className="detail__hero">
        <div className="detail__media">
          <Photo image={event.image} mode="poster" eager className="detail__img" />
          <div className="detail__grade" aria-hidden="true" />
        </div>
        <div className="wrap detail__top">
          <div className="detail__top-nav">
            <Link to="/eventos" className="back">
              <Icon name="arrow-left" size={18} /> Todos los eventos
            </Link>
            <div className="detail__top-badges">
              <span className={`aforo-badge ${saleBadgeClass(event.sale)}`}>
                {event.saleLabel}
              </span>
              <span className="aforo-badge aforo-badge--neutral">{event.code}</span>
            </div>
          </div>

          <div className="detail__titleblock">
            <p className="eyebrow eyebrow--lime">
              {genreLabel(event.genre)} · {event.city} · {event.artist}
            </p>
            <h1 className="detail__title">{event.title}</h1>
            <p className="detail__kicker">{event.kicker}</p>
          </div>

          <div className="detail__datebadge" aria-label={`Fecha: ${formatLongDate(event.startsAt)}`}>
            <span>{dp.weekday}</span>
            <b>{dp.day}</b>
            <span>{dp.month}</span>
          </div>
        </div>
      </header>

      <div className="detail__strip" aria-hidden="true">
        <Marquee
          seconds={50}
          items={[...event.tags.map((t) => t.toUpperCase()), event.city.toUpperCase(), '✺'].flatMap((t) => [t, '✺'])}
        />
      </div>

      {/* Cuerpo del detalle: Columna izquierda (Ficha técnica + Line-up + Plano acústico) y derecha sticky (Talón ticket) */}
      <div className="wrap detail__grid">
        <div className="detail__main">
          <dl className="facts">
            <div className="facts__item">
              <dt>Cuándo</dt>
              <dd>
                {formatLongDate(event.startsAt)}
                <br />
                <span>
                  {event.doors} · inicio {formatTime(event.startsAt)} h
                </span>
              </dd>
            </div>
            <div className="facts__item">
              <dt>Dónde</dt>
              <dd>
                {event.venue}
                <br />
                <span>
                  {event.address} · {event.coordinates}
                </span>
              </dd>
            </div>
            <div className="facts__item">
              <dt>Edad & Ingreso</dt>
              <dd>{event.ageRule}</dd>
            </div>
            <div className="facts__item">
              <dt>Entradas</dt>
              <dd>
                {isSoldOut(event) ? 'Agotadas' : `Desde ${formatPrice(minPrice(event))}`}
                <br />
                <span>{event.editorialTag}</span>
              </dd>
            </div>
          </dl>

          <section className="prose" aria-labelledby="sobre-h">
            <h2 id="sobre-h" className="display display--sm">Sobre el evento</h2>
            {event.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <div className="detail__acoustic-note">
              <span className="aforo-mono-tag">ESPECIFICACIÓN ACÚSTICA DE SALA</span>
              <p>{event.acoustic}</p>
            </div>
          </section>

          <section aria-labelledby="lineup-h">
            <h2 id="lineup-h" className="display display--sm">Line-up</h2>
            <ol className="lineup">
              {event.lineup.map((l) => (
                <li key={l.name} className={`lineup__row ${l.headliner ? 'is-head' : ''}`}>
                  <span className="lineup__name">{l.name}</span>
                  {l.time && <span className="lineup__time">{l.time}</span>}
                </li>
              ))}
            </ol>
          </section>

          {/* Plano acústico interactivo del recinto (de Gemini) sincronizado con el talón de entradas */}
          <section className="detail__map-section" aria-labelledby="plano-h">
            <div className="detail__map-head">
              <div>
                <span className="aforo-section__index">PLANO ESPACIAL & DISTRIBUCIÓN DE SECTORES</span>
                <h2 id="plano-h" className="display display--sm">Ubicación frente al escenario</h2>
              </div>
              <button
                type="button"
                onClick={() => openQuickEvent(event)}
                className="aforo-cta-secondary"
              >
                <span>Abrir ficha con simulador QR →</span>
              </button>
            </div>
            <VenueStageMap
              event={event}
              selectedTierId={selectedTierId}
              onSelectTier={setSelectedTierId}
            />
          </section>

          <Actions slug={event.slug} title={event.title} event={event} />
        </div>

        <aside className="detail__aside" aria-label="Comprar entradas">
          <TicketPicker
            event={event}
            selectedTierId={selectedTierId}
            onSelectTier={setSelectedTierId}
          />
        </aside>
      </div>

      {/* Otros conciertos: presentación editorial de Gemini */}
      {more.length > 0 && (
        <section className="aforo-section detail__more" aria-labelledby="mas-h">
          <div className="wrap">
            <div className="aforo-section__header">
              <div className="aforo-section__header-left">
                <span className="aforo-section__index">CIRCUITO RELACIONADO · CONTINÚA EXPLORANDO</span>
                <h2 id="mas-h" className="aforo-section__title">
                  OTROS CONCIERTOS EN PULSO
                </h2>
              </div>
              <div className="aforo-section__header-right">
                <p className="aforo-section__subtitle">
                  Otras noches recomendadas por cercanía sonora o geográfica dentro del catálogo de
                  demostración.
                </p>
                <Link to="/eventos" className="btn btn--ghost">
                  Ver todos los conciertos <Icon name="arrow-right" size={18} />
                </Link>
              </div>
            </div>

            <div className="aforo-editorial-grid">
              {more.map((e, idx) => (
                <EditorialCard
                  key={e.id}
                  event={e}
                  index={idx}
                  variant="editorial-wide"
                  onQuickOpen={openQuickEvent}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <MobileBar event={event} />
    </article>
  );
}

function Actions({
  slug,
  title,
  event,
}: {
  slug: string;
  title: string;
  event: Parameters<typeof SaveButton>[0]['event'];
}) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const share = async () => {
    const url = `${window.location.origin}/eventos/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} — AFORO`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied('ok');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setCopied('fail');
    }
    window.setTimeout(() => setCopied('idle'), 2400);
  };
  return (
    <div className="actions">
      <SaveButton event={event} className="save--text" />
      <button type="button" className="btn btn--ghost" onClick={share}>
        <Icon name={copied === 'ok' ? 'check' : 'share'} size={18} />{' '}
        {copied === 'ok' ? 'Enlace copiado' : 'Compartir'}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied === 'ok'
          ? 'Enlace copiado al portapapeles'
          : copied === 'fail'
          ? 'No se pudo copiar el enlace'
          : ''}
      </span>
      {copied === 'fail' && (
        <span className="actions__err">
          No se pudo copiar. Copia el enlace desde la barra del navegador.
        </span>
      )}
    </div>
  );
}

/** Barra fija en móvil: lleva a la selección de entradas. */
function MobileBar({ event }: { event: Parameters<typeof SaveButton>[0]['event'] }) {
  const soldOut = isSoldOut(event);
  return (
    <div className="mobilebar">
      <div>
        <small>{soldOut ? 'Agotado' : 'Desde'}</small>
        <strong>{soldOut ? '—' : formatPrice(minPrice(event))}</strong>
      </div>
      <a
        href="#entradas"
        className={`btn btn--accent ${soldOut ? 'is-disabled' : ''}`}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          document.getElementById('entradas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      >
        Elegir entradas <Icon name="arrow-right" size={18} />
      </a>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="detail" aria-busy="true">
      <span className="sr-only" role="status">Cargando evento…</span>
      <div className="detail__hero detail__hero--skeleton skeleton" />
      <div className="wrap detail__grid">
        <div className="detail__main">
          <div className="skeleton skeleton--line" style={{ width: '60%', height: 28 }} />
          <div className="skeleton skeleton--line" style={{ width: '90%', marginTop: 16 }} />
          <div className="skeleton skeleton--line" style={{ width: '80%', marginTop: 10 }} />
        </div>
        <div className="detail__aside">
          <div className="skeleton" style={{ height: 320, borderRadius: 18 }} />
        </div>
      </div>
    </div>
  );
}

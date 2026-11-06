import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { GENRES } from '../data/events';
import { Link, navigate } from '../router';
import { useDialog } from '../lib/hooks';
import { DEFAULT_FILTERS, filterEvents, genreLabel, serializeFilters } from '../lib/filters';
import { dateLabel } from '../lib/format';
import { useStore } from '../lib/store';
import { Icon } from './Icon';
import { Photo } from './Photo';

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, events, now } = useStore();
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setSearchOpen(false);
  useDialog(ref, searchOpen, close);

  useEffect(() => {
    if (searchOpen) setQ('');
  }, [searchOpen]);

  const results = useMemo(
    () => (q.trim() ? filterEvents(events, { ...DEFAULT_FILTERS, q }, now).slice(0, 6) : []),
    [q, events, now],
  );
  const total = useMemo(
    () => (q.trim() ? filterEvents(events, { ...DEFAULT_FILTERS, q }, now).length : 0),
    [q, events, now],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/eventos${serializeFilters({ ...DEFAULT_FILTERS, q: q.trim() })}`);
    close();
  };

  return (
    <div className="overlay" data-open={searchOpen} aria-hidden={!searchOpen}>
      <div className="overlay__scrim" onClick={close} />
      <div
        ref={ref}
        className="search"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar eventos"
        tabIndex={-1}
      >
        <form onSubmit={submit} className="search__form" role="search">
          <Icon name="search" size={28} />
          <input
            data-autofocus
            type="search"
            className="search__input"
            placeholder="Artista, lugar, ciudad o género"
            value={q}
            maxLength={80}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
            aria-label="Buscar eventos"
            autoComplete="off"
          />
          <button type="button" className="icon-btn" onClick={close} aria-label="Cerrar búsqueda">
            <Icon name="close" />
          </button>
        </form>

        {q.trim() ? (
          results.length ? (
            <>
              <ul className="search__results">
                {results.map((ev) => (
                  <li key={ev.id} className="search__item">
                    <Link
                      to={`/eventos/${ev.slug}`}
                      newTab
                      className="search__row"
                      onClick={close}
                    >
                      <span className="search__thumb">
                        <Photo image={ev.image} mode="poster" />
                      </span>
                      <span className="search__title">{ev.title}</span>
                      <span className="search__meta">
                        {dateLabel(ev)} · {ev.city} · {genreLabel(ev.genre)} · {ev.artist}
                      </span>
                    </Link>
                    <div className="search__actions">
                      <Link
                        to={`/eventos/${ev.slug}`}
                        newTab
                        className="link-btn"
                        onClick={close}
                      >
                        Ver evento ↗
                      </Link>
                      <Link
                        to={`/eventos/${ev.slug}#entradas`}
                        newTab
                        className="link-btn"
                        onClick={close}
                      >
                        Ver entradas →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="submit"
                form=""
                className="btn btn--solid search__all"
                onClick={submit}
              >
                Ver {total} {total === 1 ? 'resultado' : 'resultados'}
                <Icon name="arrow-right" size={18} />
              </button>
            </>
          ) : (
            <p className="search__empty" role="status">
              No encontramos eventos para “{q.trim()}”. Prueba con otra ciudad o género.
            </p>
          )
        ) : (
          <div className="search__hints">
            <p className="eyebrow">Explora por sonido</p>
            <ul className="chips">
              {GENRES.map((g) => (
                <li key={g.id}>
                  <Link
                    to={`/eventos${serializeFilters({ ...DEFAULT_FILTERS, genre: g.id })}`}
                    className="chip"
                    onClick={close}
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

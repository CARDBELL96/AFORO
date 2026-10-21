import { useEffect, useMemo, useRef, useState } from 'react';
import { GENRES } from '../data/events';
import { navigate, useRoute } from '../router';
import { FilterPanel } from '../components/FilterPanel';
import { Icon } from '../components/Icon';
import { PosterCard, RowCard } from '../components/EventCard';
import { EmptyState, ErrorState, SkeletonGrid } from '../components/States';
import { useDebounced, useDialog, useDocumentTitle } from '../lib/hooks';
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  filterEvents,
  genreLabel,
  parseFilters,
  serializeFilters,
  upcoming,
  type Filters,
} from '../lib/filters';
import { useStore } from '../lib/store';

type View = 'grid' | 'list';

export function Events() {
  const { search } = useRoute();
  const { eventsState, events, now, reload, saved } = useStore();
  const filters = useMemo(() => parseFilters(search), [search]);
  const [view, setView] = useState<View>('grid');
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useDialog(sheetRef, sheetOpen, () => setSheetOpen(false));

  // El texto se escribe sin retraso en el campo, pero la URL (y la lista) se actualizan con debounce.
  const [qDraft, setQDraft] = useState(filters.q);
  const qDebounced = useDebounced(qDraft, 200);
  useEffect(() => setQDraft(filters.q), [filters.q]);
  useEffect(() => {
    if (qDebounced !== filters.q) update({ q: qDebounced }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  const update = (patch: Partial<Filters>, replace = false) => {
    const next = { ...parseFilters(window.location.search), ...patch };
    navigate(`/eventos${serializeFilters(next)}`, { replace, scroll: false });
  };

  const pool = useMemo(() => upcoming(events, now), [events, now]);
  const results = useMemo(() => filterEvents(events, filters, now, saved), [events, filters, now, saved]);
  const active = activeFilterCount(filters);
  const effective: Filters = { ...filters, q: qDraft };

  const title = filters.genre ? `${genreLabel(filters.genre)} — Eventos` : 'Explorar eventos';
  useDocumentTitle(`${title} · AFORO`);

  const genre = GENRES.find((g) => g.id === filters.genre);
  const heading = filters.saved ? 'Tus guardados' : genre ? genre.label : filters.city ? `Eventos en ${filters.city}` : 'Todos los eventos';
  const ready = eventsState.status === 'ready';

  return (
    <div className="explore">
      <header className="explore__head">
        <div className="wrap">
          <h1 className="display display--lg">{heading}</h1>
          <p className="explore__sub">
            {genre ? genre.blurb : 'Conciertos, festivales, fiestas y carnavales de todo el Perú.'}
            {ready && (
              <span className="explore__count" role="status" aria-live="polite">
                {results.length} {results.length === 1 ? 'evento' : 'eventos'}
              </span>
            )}
          </p>
          <ul className="chips chips--scroll" aria-label="Filtrar por sonido">
            <li>
              <button type="button" className={`chip ${filters.genre === null ? 'is-on' : ''}`} aria-pressed={filters.genre === null} onClick={() => update({ genre: null })}>
                Todo
              </button>
            </li>
            {GENRES.map((g) => (
              <li key={g.id}>
                <button type="button" className={`chip ${filters.genre === g.id ? 'is-on' : ''}`} aria-pressed={filters.genre === g.id} onClick={() => update({ genre: filters.genre === g.id ? null : g.id })}>
                  {g.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="wrap explore__body">
        <aside className="explore__side" aria-label="Filtros">
          <FilterPanel
            filters={effective}
            onChange={(patch) => ('q' in patch ? setQDraft(patch.q ?? '') : update(patch))}
            pool={pool}
            savedCount={saved.size}
            showSort
          />
        </aside>

        <section className="explore__main" aria-label="Resultados">
          <div className="toolbar">
            <button type="button" className="btn btn--ghost toolbar__filters" onClick={() => setSheetOpen(true)}>
              <Icon name="filter" size={18} /> Filtros{active > 0 ? ` · ${active}` : ''}
            </button>
            <div className="toolbar__view" role="group" aria-label="Vista">
              <button type="button" className={`icon-btn ${view === 'grid' ? 'is-on' : ''}`} aria-pressed={view === 'grid'} onClick={() => setView('grid')} aria-label="Vista de carteles">
                <Icon name="grid" size={18} />
              </button>
              <button type="button" className={`icon-btn ${view === 'list' ? 'is-on' : ''}`} aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label="Vista de lista">
                <Icon name="list" size={18} />
              </button>
            </div>
          </div>

          {active > 0 && ready && (
            <ul className="applied" aria-label="Filtros aplicados">
              {filters.q && <li><button type="button" className="chip chip--x" onClick={() => update({ q: '' })}>“{filters.q}” <Icon name="close" size={14} /></button></li>}
              {filters.genre && <li><button type="button" className="chip chip--x" onClick={() => update({ genre: null })}>{genreLabel(filters.genre)} <Icon name="close" size={14} /></button></li>}
              {filters.city && <li><button type="button" className="chip chip--x" onClick={() => update({ city: null })}>{filters.city} <Icon name="close" size={14} /></button></li>}
              {filters.when !== 'any' && <li><button type="button" className="chip chip--x" onClick={() => update({ when: 'any' })}>{filters.when === 'weekend' ? 'Fines de semana' : filters.when === '30d' ? 'Próximos 30 días' : 'Próximos 3 meses'} <Icon name="close" size={14} /></button></li>}
              {filters.maxPrice !== null && <li><button type="button" className="chip chip--x" onClick={() => update({ maxPrice: null })}>Hasta S/ {filters.maxPrice} <Icon name="close" size={14} /></button></li>}
              {filters.saved && <li><button type="button" className="chip chip--x" onClick={() => update({ saved: false })}>Guardados <Icon name="close" size={14} /></button></li>}
            </ul>
          )}

          {eventsState.status === 'loading' && <SkeletonGrid count={6} />}
          {eventsState.status === 'error' && <ErrorState onRetry={reload} message={eventsState.message} />}
          {ready && results.length === 0 && (
            <EmptyState
              title={filters.saved && saved.size === 0 ? 'Aún no guardas ningún evento' : 'Ningún evento coincide'}
              text={
                filters.saved && saved.size === 0
                  ? 'Toca el corazón en cualquier evento para guardarlo y encontrarlo aquí.'
                  : 'Prueba quitando algún filtro o buscando por otra ciudad, artista o género.'
              }
              action={{ label: 'Limpiar filtros', onClick: () => { setQDraft(''); navigate(`/eventos${serializeFilters(DEFAULT_FILTERS)}`, { scroll: false }); } }}
            />
          )}
          {ready && results.length > 0 && (view === 'grid' ? (
            <ul className="grid">
              {results.map((e, i) => (
                <li key={e.id}><PosterCard event={e} eager={i < 3} /></li>
              ))}
            </ul>
          ) : (
            <ul className="rows">
              {results.map((e) => (
                <li key={e.id}><RowCard event={e} /></li>
              ))}
            </ul>
          ))}
        </section>
      </div>

      <div className="sheet" data-open={sheetOpen} aria-hidden={!sheetOpen}>
        <div className="sheet__scrim" onClick={() => setSheetOpen(false)} />
        <div ref={sheetRef} className="sheet__panel" role="dialog" aria-modal="true" aria-label="Filtros" tabIndex={-1}>
          <div className="sheet__bar">
            <span className="sheet__grip" aria-hidden="true" />
            <button type="button" className="icon-btn" onClick={() => setSheetOpen(false)} aria-label="Cerrar filtros">
              <Icon name="close" />
            </button>
          </div>
          <div className="sheet__scroll">
            <FilterPanel
              filters={effective}
              onChange={(patch) => ('q' in patch ? setQDraft(patch.q ?? '') : update(patch))}
              pool={pool}
              savedCount={saved.size}
              showSort
            />
          </div>
          <div className="sheet__foot">
            <button type="button" className="btn btn--solid btn--block" onClick={() => setSheetOpen(false)} data-autofocus>
              Ver {results.length} {results.length === 1 ? 'evento' : 'eventos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

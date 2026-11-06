import { useEffect, useMemo, useRef, useState } from 'react';
import { GENRES, type GenreId } from '../data/events';
import { Link } from '../router';
import {
  DEFAULT_FILTERS,
  filterEvents,
  genreLabel,
  isSoldOut,
  minPrice,
  upcoming,
  type Filters,
} from '../lib/filters';
import { dayParts, formatPrice, formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { EditorialCard, saleBadgeClass } from './EventCard';
import { Icon } from './Icon';

const CITY_TABS = ['TODAS', 'Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Ayacucho', 'Máncora', 'Iquitos', 'Cajamarca', 'Huancayo'];

const MONTH_OPTIONS = [
  { value: 'TODOS', label: 'Toda la temporada' },
  { value: '2026-10', label: 'Octubre 2026' },
  { value: '2026-11', label: 'Noviembre 2026' },
  { value: '2026-12', label: 'Diciembre 2026' },
  { value: '2027-01', label: 'Enero 2027' },
  { value: '2027-02', label: 'Febrero 2027' },
];

/** Asigna el patrón asimétrico del mosaico editorial de Gemini (`featured-xl`, `poster-tall`, `editorial-wide`, `standard`). */
function getMosaicVariant(idx: number): 'featured-xl' | 'poster-tall' | 'editorial-wide' | 'standard' {
  if (idx === 0) return 'featured-xl';
  if (idx === 1) return 'poster-tall';
  if (idx === 4 || idx === 5) return 'editorial-wide';
  if (idx === 9 || idx === 10) return 'editorial-wide';
  return 'standard';
}

interface PulseCatalogSectionProps {
  externalGenreFilter?: GenreId | 'TODAS';
  onExternalGenreChange?: (genre: GenreId | 'TODAS') => void;
}

export function PulseCatalogSection({
  externalGenreFilter = 'TODAS',
  onExternalGenreChange,
}: PulseCatalogSectionProps) {
  const { eventsState, events, now, reload, globalCity, setGlobalCity } = useStore();

  const [categoryId, setCategoryId] = useState<GenreId | 'TODAS'>(externalGenreFilter);
  const [monthKey, setMonthKey] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<'featured' | 'date' | 'price-asc'>('featured');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<'mosaic' | 'ledger'>('mosaic');

  const mosaicViewRef = useRef<HTMLDivElement | null>(null);
  const ledgerViewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCategoryId(externalGenreFilter);
  }, [externalGenreFilter]);

  const pool = useMemo(() => upcoming(events, now), [events, now]);

  const filtered = useMemo(() => {
    const f: Filters = {
      ...DEFAULT_FILTERS,
      city: globalCity === 'TODAS' ? null : globalCity,
      genre: categoryId === 'TODAS' ? null : categoryId,
      monthKey: monthKey === 'TODOS' ? null : monthKey,
      onlyAvailable,
      sort: sortBy,
    };
    return filterEvents(events, f, now);
  }, [events, globalCity, categoryId, monthKey, onlyAvailable, sortBy, now]);

  const hasActiveFilters =
    globalCity !== 'TODAS' ||
    categoryId !== 'TODAS' ||
    monthKey !== 'TODOS' ||
    onlyAvailable;

  const resetFilters = () => {
    setGlobalCity('TODAS');
    setCategoryId('TODAS');
    onExternalGenreChange?.('TODAS');
    setMonthKey('TODOS');
    setOnlyAvailable(false);
    setSortBy('featured');
  };

  const switchDisplayMode = (mode: 'mosaic' | 'ledger') => {
    setDisplayMode(mode);
    requestAnimationFrame(() => {
      const target = mode === 'mosaic' ? mosaicViewRef.current : ledgerViewRef.current;
      target?.focus();
    });
  };

  return (
    <section
      id="catalogo"
      className="aforo-section aforo-catalog"
      aria-labelledby="catalog-heading"
    >
      <div className="wrap">
        {/* Cabecera Editorial de Sección */}
        <div className="aforo-section__header">
          <div className="aforo-section__header-left">
            <span className="aforo-section__index">01 // CARTELERA OFICIAL (DEMO)</span>
            <h2 id="catalog-heading" className="aforo-section__title">
              PROGRAMACIÓN EN PULSO
            </h2>
          </div>
          <div className="aforo-section__header-right">
            <p className="aforo-section__subtitle">
              Mostrando <strong>{filtered.length}</strong> de {pool.length} escenarios de
              demostración en el circuito peruano. Alterna entre el mosaico editorial de
              pósters y la tabla de taquilla rápida.
            </p>
            <div className="aforo-catalog__toolbar-row">
              <div
                className="aforo-catalog__view-switcher"
                role="group"
                aria-label="Modo de visualización de cartelera"
              >
                <button
                  type="button"
                  className={`aforo-view-mode-btn ${displayMode === 'mosaic' ? 'is-active' : ''}`}
                  onClick={() => switchDisplayMode('mosaic')}
                >
                  01 · Mosaico Editorial
                </button>
                <button
                  type="button"
                  className={`aforo-view-mode-btn ${displayMode === 'ledger' ? 'is-active' : ''}`}
                  onClick={() => switchDisplayMode('ledger')}
                >
                  02 · Cronograma / Taquilla
                </button>
              </div>
              <Link to="/eventos" className="aforo-catalog__explore-link">
                <span>Buscador con filtros laterales</span>
                <Icon name="arrow-up-right" size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Ciudades */}
        <div
          className="aforo-filter-deck"
          role="region"
          aria-label="Controles de filtrado de cartelera"
        >
          <div
            className="aforo-filter-deck__cities"
            role="tablist"
            aria-label="Filtrar cartelera por ciudad"
          >
            {CITY_TABS.map((city) => {
              const active = globalCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setGlobalCity(city)}
                  className={`aforo-city-tab ${active ? 'is-active' : ''}`}
                >
                  {city === 'TODAS' ? 'Todo el Perú' : city}
                </button>
              );
            })}
          </div>

          <div className="aforo-filter-deck__controls">
            <div className="aforo-control-group">
              <label htmlFor="catalog-category-select" className="aforo-control-group__label">
                MOVIMIENTO
              </label>
              <select
                id="catalog-category-select"
                value={categoryId}
                onChange={(e) => {
                  const val = e.target.value as GenreId | 'TODAS';
                  setCategoryId(val);
                  onExternalGenreChange?.(val);
                }}
                className="aforo-control-group__select"
              >
                <option value="TODAS">Todas las categorías</option>
                {GENRES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="aforo-control-group">
              <label htmlFor="catalog-month-select" className="aforo-control-group__label">
                MES
              </label>
              <select
                id="catalog-month-select"
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="aforo-control-group__select"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="aforo-control-group">
              <label htmlFor="catalog-sort-select" className="aforo-control-group__label">
                ORDENAR POR
              </label>
              <select
                id="catalog-sort-select"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'featured' | 'date' | 'price-asc')
                }
                className="aforo-control-group__select"
              >
                <option value="featured">Curaduría AFORO</option>
                <option value="date">Fecha más próxima</option>
                <option value="price-asc">Menor precio inicial</option>
              </select>
            </div>

            <label className="aforo-toggle-check">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
              />
              <span>Solo con aforo disponible</span>
            </label>

            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="aforo-reset-btn">
                Limpiar filtros ×
              </button>
            )}
          </div>
        </div>

        {/* Estado 1: Esqueleto de carga */}
        {eventsState.status === 'loading' && (
          <div
            className="aforo-catalog__skeleton-grid"
            role="status"
            aria-live="polite"
            aria-label="Cargando cartelera de eventos"
          >
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aforo-skeleton-card">
                <div className="aforo-skeleton-card__media" />
                <div className="aforo-skeleton-card__lines">
                  <div className="aforo-skeleton-line aforo-skeleton-line--short" />
                  <div className="aforo-skeleton-line aforo-skeleton-line--title" />
                  <div className="aforo-skeleton-line aforo-skeleton-line--medium" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado 2: Error */}
        {eventsState.status === 'error' && (
          <div className="aforo-state-panel aforo-state-panel--error" role="alert">
            <span className="aforo-mono-tag">CÓDIGO DE ESTADO · SINCRONIZACIÓN INTERRUMPIDA</span>
            <h3 className="aforo-state-panel__title">
              No pudimos sincronizar el pulso de la cartelera
            </h3>
            <p className="aforo-state-panel__desc">
              Comprueba tu conexión o vuelve a cargar el catálogo local de demostración.
            </p>
            <button type="button" onClick={reload} className="aforo-cta-primary">
              <span>Reintentar sincronización</span>
            </button>
          </div>
        )}

        {/* Estado 3: Sin coincidencias */}
        {eventsState.status === 'ready' && filtered.length === 0 && (
          <div className="aforo-state-panel" role="status" aria-live="polite">
            <span className="aforo-mono-tag">0 COINCIDENCIAS EN CARTELERA</span>
            <h3 className="aforo-state-panel__title">
              Ningún evento coincide con los filtros actuales
            </h3>
            <p className="aforo-state-panel__desc">
              Prueba cambiando la ciudad seleccionada o explorando toda la temporada 2026/27.
            </p>
            <button type="button" onClick={resetFilters} className="aforo-cta-primary">
              <span>Restablecer toda la cartelera</span>
            </button>
          </div>
        )}

        {/* Estado 4: Vistas dobles en caché (Mosaico Editorial / Cronograma) */}
        {eventsState.status === 'ready' && filtered.length > 0 && (
          <div className="aforo-catalog__views-stage">
            <div
              id="catalog-view-mosaic"
              ref={mosaicViewRef}
              tabIndex={-1}
              aria-hidden={displayMode !== 'mosaic'}
              className={`spa-view ${displayMode !== 'mosaic' ? 'inactive' : ''}`}
            >
              <div className="aforo-editorial-grid">
                {filtered.map((event, idx) => (
                  <EditorialCard
                    key={event.id}
                    event={event}
                    index={idx}
                    variant={getMosaicVariant(idx)}
                  />
                ))}
              </div>
            </div>

            <div
              id="catalog-view-ledger"
              ref={ledgerViewRef}
              tabIndex={-1}
              aria-hidden={displayMode !== 'ledger'}
              className={`spa-view ${displayMode !== 'ledger' ? 'inactive' : ''}`}
            >
              <div className="aforo-ledger" role="list" aria-label="Cronograma de taquilla">
                {filtered.map((event, idx) => {
                  const soldOut = isSoldOut(event);
                  const dp = dayParts(event.startsAt);
                  const lowest = minPrice(event);
                  const openTiers = event.tiers.filter((t) => t.status !== 'sold_out').length;
                  return (
                    <div
                      key={event.id}
                      role="listitem"
                      data-accent={event.accent}
                      className={`aforo-ledger__row ${soldOut ? 'is-sold-out' : ''}`}
                    >
                      <div className="aforo-ledger__date-col">
                        <span className="aforo-ledger__idx">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <strong className="aforo-ledger__date">
                          {dp.weekday} {dp.day} {dp.month} · {formatTime(event.startsAt)}
                        </strong>
                        <span className="aforo-ledger__doors">{event.doors}</span>
                      </div>

                      <div className="aforo-ledger__main-col">
                        <span className="aforo-ledger__artist">{event.artist}</span>
                        <h3 className="aforo-ledger__title">
                          <Link to={`/eventos/${event.slug}`} newTab>
                            {event.title}
                          </Link>
                        </h3>
                        <span className="aforo-ledger__cat">{genreLabel(event.genre)}</span>
                      </div>

                      <div className="aforo-ledger__venue-col">
                        <strong className="aforo-ledger__city">{event.city}</strong>
                        <span className="aforo-ledger__venue">
                          {event.venue} ({event.district})
                        </span>
                        <span className="aforo-ledger__coords">{event.coordinates}</span>
                      </div>

                      <div className="aforo-ledger__zones-col">
                        <span className={`aforo-badge ${saleBadgeClass(event.sale)}`}>
                          {event.saleLabel}
                        </span>
                        <span className="aforo-ledger__zones-count">
                          {openTiers} de {event.tiers.length} sectores activos
                        </span>
                      </div>

                      <div className="aforo-ledger__action-col">
                        <div className="aforo-ledger__price-box">
                          <span>DESDE</span>
                          <strong>{formatPrice(lowest)}</strong>
                        </div>
                        <div className="aforo-ledger__btns">
                          <Link
                            to={`/eventos/${event.slug}#entradas`}
                            newTab
                            className="aforo-cta-primary"
                          >
                            <span>{soldOut ? 'Ficha y plano' : 'Elegir sector'}</span>
                          </Link>
                          <Link
                            to={`/eventos/${event.slug}`}
                            newTab
                            className="aforo-cta-secondary"
                          >
                            <span>Ver evento</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import { useId, type ChangeEvent } from 'react';
import { GENRES, type AforoEvent, type GenreId } from '../data/events';
import {
  DEFAULT_FILTERS,
  SORT_OPTIONS,
  WHEN_OPTIONS,
  activeFilterCount,
  citiesWithCount,
  minPrice,
  type Filters,
  type SortId,
  type WhenId,
} from '../lib/filters';
import { Icon } from './Icon';

interface Props {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  /** Eventos vigentes (sin filtrar), para mostrar los conteos por género y ciudad. */
  pool: readonly AforoEvent[];
  savedCount: number;
  showSort?: boolean;
}

export function FilterPanel({ filters, onChange, pool, savedCount, showSort }: Props) {
  const uid = useId();
  const cities = citiesWithCount(pool);
  const prices = pool.map(minPrice);
  const lo = prices.length ? Math.floor(Math.min(...prices) / 5) * 5 : 0;
  const hi = prices.length ? Math.ceil(Math.max(...prices) / 5) * 5 : 100;
  const sliderValue = filters.maxPrice ?? hi;
  const active = activeFilterCount(filters);

  const genreCount = (id: GenreId) => pool.filter((e) => e.genre === id).length;

  return (
    <div className="filters">
      <div className="filters__head">
        <h2 className="filters__title">Filtros {active > 0 && <span className="drawer__count">{active}</span>}</h2>
        {active > 0 && (
          <button type="button" className="link-btn" onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}>
            Limpiar
          </button>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${uid}-q`}>Buscar</label>
        <div className="field__input">
          <Icon name="search" size={18} />
          <input
            id={`${uid}-q`}
            type="search"
            placeholder="Artista, lugar o ciudad"
            value={filters.q}
            maxLength={80}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ q: e.target.value })}
            autoComplete="off"
          />
        </div>
      </div>

      {showSort && (
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-sort`}>Ordenar por</label>
          <select id={`${uid}-sort`} className="select" value={filters.sort} onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange({ sort: e.target.value as SortId })}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      <fieldset className="field">
        <legend className="field__label">Sonido</legend>
        <ul className="chips chips--wrap">
          {GENRES.map((g) => {
            const on = filters.genre === g.id;
            return (
              <li key={g.id}>
                <button type="button" className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => onChange({ genre: on ? null : g.id })}>
                  {g.label} <span className="chip__n">{genreCount(g.id)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="field">
        <legend className="field__label">Ciudad</legend>
        <ul className="chips chips--wrap">
          {cities.map(({ city, count }) => {
            const on = filters.city === city;
            return (
              <li key={city}>
                <button type="button" className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => onChange({ city: on ? null : city })}>
                  {city} <span className="chip__n">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="field">
        <legend className="field__label">Fecha</legend>
        <div className="radios">
          {WHEN_OPTIONS.map((o) => (
            <label key={o.id} className="radio">
              <input type="radio" name={`${uid}-when`} checked={filters.when === o.id} onChange={() => onChange({ when: o.id as WhenId })} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor={`${uid}-price`}>
          Precio desde, hasta <strong>{filters.maxPrice === null ? 'sin límite' : `S/ ${filters.maxPrice}`}</strong>
        </label>
        <input
          id={`${uid}-price`}
          className="range"
          type="range"
          min={lo}
          max={hi}
          step={5}
          value={sliderValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const v = Number(e.target.value);
            onChange({ maxPrice: v >= hi ? null : v });
          }}
        />
        <div className="range__scale" aria-hidden="true">
          <span>S/ {lo}</span>
          <span>S/ {hi}+</span>
        </div>
      </div>

      <label className="check">
        <input type="checkbox" checked={filters.saved} onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ saved: e.target.checked })} />
        <span>
          Solo guardados <span className="chip__n">{savedCount}</span>
        </span>
      </label>
    </div>
  );
}

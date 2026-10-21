import { useState } from 'react';
import { PERU_CITY_SCENES, type PeruCityScene } from '../data/editorial';
import { Link } from '../router';
import { upcoming } from '../lib/filters';
import { dayParts, formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { Photo } from './Photo';

export function PeruDiscoverySection() {
  const { events, now, globalCity, setGlobalCity } = useStore();
  const pool = upcoming(events, now);

  const initialCity =
    PERU_CITY_SCENES.some((s) => s.city === globalCity) ? globalCity : 'Arequipa';
  const [activeSceneCity, setActiveSceneCity] = useState<string>(initialCity);

  const currentScene: PeruCityScene =
    PERU_CITY_SCENES.find((s) => s.city === activeSceneCity) ?? PERU_CITY_SCENES[0]!;

  const cityEvents = pool.filter((ev) => ev.city === currentScene.city);

  const handleExploreCityCatalog = (city: string) => {
    setGlobalCity(city);
    const catalogEl = document.getElementById('catalogo');
    catalogEl?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="peru"
      className="aforo-section aforo-peru-section"
      aria-labelledby="peru-discovery-heading"
    >
      <div className="wrap">
        <div className="aforo-section__header">
          <div className="aforo-section__header-left">
            <span className="aforo-section__index">03 // DESCENTRALIZACIÓN SONORA</span>
            <h2 id="peru-discovery-heading" className="aforo-section__title">
              DESCUBRE EL PERÚ EN VIVO
            </h2>
          </div>
          <div className="aforo-section__header-right">
            <p className="aforo-section__subtitle">
              La música en vivo no termina en la Panamericana. Exploramos los circuitos
              independientes, teatros de sillar, patios coloniales y explanadas costeras que
              definen la escena nacional actual.
            </p>
          </div>
        </div>

        <div className="aforo-peru__layout">
          {/* Columna izquierda: Selector de índice regional */}
          <div
            className="aforo-peru__selector"
            role="tablist"
            aria-label="Ciudades del circuito AFORO"
          >
            {PERU_CITY_SCENES.map((scene) => {
              const isSelected = scene.city === currentScene.city;
              const count = pool.filter((e) => e.city === scene.city).length;

              return (
                <button
                  key={scene.city}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveSceneCity(scene.city)}
                  className={`aforo-peru__city-row ${isSelected ? 'is-active' : ''}`}
                >
                  <div className="aforo-peru__city-row-top">
                    <span className="aforo-peru__region-code">{scene.regionCode}</span>
                    <span className="aforo-peru__altitude">{scene.altitude}</span>
                  </div>
                  <div className="aforo-peru__city-row-main">
                    <span className="aforo-peru__city-name">{scene.city}</span>
                    <span className="aforo-peru__city-count">
                      {count} {count === 1 ? 'evento' : 'eventos'}
                    </span>
                  </div>
                  <p className="aforo-peru__city-kicker">{scene.headline}</p>
                </button>
              );
            })}
          </div>

          {/* Columna derecha: Dossier editorial de la ciudad activa */}
          <div
            className="aforo-peru__dossier"
            data-accent={currentScene.accent}
            role="tabpanel"
            aria-label={`Escena musical de ${currentScene.city}`}
          >
            <div className="aforo-peru__dossier-media">
              <Photo
                image={currentScene.image}
                mode="photo"
                duotone
                className="aforo-peru__dossier-img"
              />
              <div className="aforo-peru__dossier-overlay" aria-hidden="true" />
              <div className="aforo-peru__dossier-coords">
                <span>{currentScene.regionCode}</span>
                <span>{currentScene.coordinates}</span>
                <span>ALTITUD: {currentScene.altitude}</span>
              </div>
            </div>

            <div className="aforo-peru__dossier-body">
              <div className="aforo-peru__dossier-header">
                <div>
                  <span className="aforo-mono-tag">
                    CRÓNICA DE ESCENA · {currentScene.city.toUpperCase()}
                  </span>
                  <h3 className="aforo-peru__dossier-title">{currentScene.headline}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleExploreCityCatalog(currentScene.city)}
                  className="aforo-cta-primary"
                >
                  <span>Filtrar cartelera en {currentScene.city}</span>
                </button>
              </div>

              <p className="aforo-peru__dossier-text">{currentScene.culturalPerspective}</p>

              <div className="aforo-peru__dossier-columns">
                <div className="aforo-peru__meta-box">
                  <h4 className="aforo-peru__meta-title">ESPACIOS & RECINTOS CLAVE</h4>
                  <ul className="aforo-peru__meta-list">
                    {currentScene.keyVenues.map((venue) => (
                      <li key={venue}>{venue}</li>
                    ))}
                  </ul>
                </div>

                <div className="aforo-peru__meta-box">
                  <h4 className="aforo-peru__meta-title">IDENTIDAD SONORA ACTUAL</h4>
                  <ul className="aforo-peru__meta-list">
                    {currentScene.sonicIdentity.map((identity) => (
                      <li key={identity}>{identity}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Eventos activos en la ciudad */}
              <div className="aforo-peru__city-events">
                <span className="aforo-peru__meta-title">
                  FECHAS PROGRAMADAS EN {currentScene.city.toUpperCase()} (DEMO):
                </span>
                <div className="aforo-peru__mini-cards">
                  {cityEvents.map((ev) => {
                    const dp = dayParts(ev.startsAt);
                    return (
                      <div key={ev.id} className="aforo-peru__mini-card">
                        <div>
                          <span className="aforo-peru__mini-date">
                            {dp.weekday} {dp.day} {dp.month} · {formatTime(ev.startsAt)}
                          </span>
                          <h5 className="aforo-peru__mini-title">
                            <Link to={`/eventos/${ev.slug}`} newTab>
                              {ev.title}
                            </Link>
                          </h5>
                          <p className="aforo-peru__mini-venue">
                            {ev.artist} · {ev.venue}
                          </p>
                        </div>
                        <div className="aforo-peru__mini-actions">
                          <Link
                            to={`/eventos/${ev.slug}#entradas`}
                            newTab
                            className="aforo-peru__mini-btn"
                          >
                            Ver entradas →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

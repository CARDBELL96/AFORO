import { useState } from 'react';
import { HERO_IMAGE, type GenreId } from '../data/events';
import { Link } from '../router';
import { PulseDivider } from '../components/Brand';
import { CategoriesMosaicSection } from '../components/CategoriesMosaicSection';
import { Icon } from '../components/Icon';
import { Marquee } from '../components/Marquee';
import { PeruDiscoverySection } from '../components/PeruDiscoverySection';
import { Photo } from '../components/Photo';
import { PulseCatalogSection } from '../components/PulseCatalogSection';
import { useDocumentTitle } from '../lib/hooks';
import { DEFAULT_FILTERS, filterEvents, genreLabel, serializeFilters, upcoming } from '../lib/filters';
import { dayParts, formatTime } from '../lib/format';
import { useStore } from '../lib/store';

export function Home() {
  useDocumentTitle('AFORO — El pulso de lo que vivimos');
  const [selectedGenre, setSelectedGenre] = useState<GenreId | 'TODAS'>('TODAS');

  return (
    <>
      <Hero />
      <PulseCatalogSection
        externalGenreFilter={selectedGenre}
        onExternalGenreChange={setSelectedGenre}
      />
      <PulseDivider />
      <CategoriesMosaicSection
        selectedCategory={selectedGenre}
        onSelectCategory={setSelectedGenre}
      />
      <PulseDivider />
      <PeruDiscoverySection />
      <Closing />
    </>
  );
}

function Hero() {
  const { eventsState, events, now } = useStore();
  const next = eventsState.status === 'ready' ? filterEvents(events, DEFAULT_FILTERS, now)[0] : undefined;
  const dp = next ? dayParts(next.startsAt) : null;
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-h">
      <div className="hero__media">
        <Photo src={HERO_IMAGE.src} alt={HERO_IMAGE.alt} eager className="hero__img" />
        <div className="hero__grade" aria-hidden="true" />
      </div>

      <div className="wrap hero__inner">
        <p className="eyebrow eyebrow--lime hero__eyebrow">El pulso de lo que vivimos</p>
        <h1 id="hero-h" className="hero__title">
          <span className="hero__line">LA NOCHE</span>
          <span className="hero__line hero__line--accent">NO SE CUENTA.</span>
          <span className="hero__line hero__line--serif">se vive.</span>
        </h1>
        <p className="hero__lede">
          Conciertos, festivales, fiestas y carnavales de todo el Perú, en un solo lugar. Elige tu noche.
        </p>
        <div className="hero__cta">
          <Link to="/eventos" className="btn btn--accent btn--lg">
            Explorar eventos <Icon name="arrow-right" size={20} />
          </Link>
          <Link
            to={`/eventos${serializeFilters({ ...DEFAULT_FILTERS, when: 'weekend' })}`}
            className="btn btn--outline btn--lg"
          >
            Este fin de semana
          </Link>
        </div>
      </div>

      {next && dp ? (
        <Link to={`/eventos/${next.slug}`} className="hero__next" aria-label={`Próximo evento: ${next.title}`}>
          <span className="hero__next-label">Próximo</span>
          <span className="hero__next-date">
            <b>{dp.day}</b>
            <span>{dp.month}</span>
          </span>
          <span className="hero__next-body">
            <strong>{next.title}</strong>
            <small>
              {next.venue}, {next.city} · {formatTime(next.startsAt)} h
            </small>
          </span>
          <Icon name="arrow-up-right" size={22} />
        </Link>
      ) : (
        <div className="hero__next hero__next--ghost" aria-hidden="true" />
      )}

      <div className="hero__strip" aria-hidden="true">
        <Marquee
          seconds={46}
          items={[
            'CHICHA',
            '✺',
            'ELECTRÓNICA',
            '✺',
            'SALSA',
            '✺',
            'CARNAVAL',
            '✺',
            'FESTIVALES',
            '✺',
            'INDIE',
            '✺',
            'ROCK',
            '✺',
            'CUMBIA',
            '✺',
            'URBANA',
            '✺',
          ]}
        />
      </div>
    </section>
  );
}

function Closing() {
  const { events, now } = useStore();
  const g = genreLabel('festivales');
  const total = upcoming(events, now).length;
  return (
    <section className="closing" aria-labelledby="cierre-h">
      <div className="wrap closing__inner">
        <h2 id="cierre-h" className="closing__title">
          Tu próxima noche ya está <em>en cartelera.</em>
        </h2>
        <div className="closing__cta">
          <Link to="/eventos" className="btn btn--accent btn--lg">
            Explorar {total || ''} eventos <Icon name="arrow-right" size={20} />
          </Link>
          <Link
            to={`/eventos${serializeFilters({ ...DEFAULT_FILTERS, genre: 'festivales' })}`}
            className="btn btn--outline btn--lg"
          >
            {g}
          </Link>
        </div>
      </div>
    </section>
  );
}

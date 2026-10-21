import { Link, navigate, useRoute } from '../router';
import { cartCount } from '../lib/cart';
import { DEFAULT_FILTERS, filterEvents, serializeFilters } from '../lib/filters';
import { dateLabel } from '../lib/format';
import { useStore } from '../lib/store';
import { Brand } from './Brand';
import { Icon } from './Icon';
import { Marquee } from './Marquee';

const HEADER_CITIES = ['TODAS', 'Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Ayacucho', 'Máncora', 'Iquitos', 'Cajamarca', 'Huancayo'];

function Ticker() {
  const { events, now } = useStore();
  const next = filterEvents(events, DEFAULT_FILTERS, now).slice(0, 8);
  const items = next.length
    ? next.map((e) => (
        <Link key={e.id} to={`/eventos/${e.slug}`} className="ticker__item" tabIndex={-1}>
          <b>{dateLabel(e)}</b> {e.title.toUpperCase()} <i>{e.city.toUpperCase()}</i>
        </Link>
      ))
    : [<span key="brand">AFORO · EL PULSO DE LO QUE VIVIMOS</span>];
  return (
    <div className="ticker" aria-label="Próximos eventos">
      <Marquee items={items} seconds={55} />
    </div>
  );
}

export function Header({ solid }: { solid: boolean }) {
  const { path } = useRoute();
  const {
    lines,
    saved,
    tickets,
    setCartOpen,
    setSearchOpen,
    setTicketsOpen,
    globalCity,
    setGlobalCity,
  } = useStore();
  const count = cartCount(lines);
  const exploring = path.startsWith('/eventos');

  const scrollToSection = (sectionId: string) => {
    if (path !== '/') {
      navigate('/');
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCityChange = (city: string) => {
    setGlobalCity(city);
    if (path === '/eventos') {
      navigate(`/eventos${serializeFilters({ ...DEFAULT_FILTERS, city: city === 'TODAS' ? null : city })}`, {
        scroll: false,
      });
    } else if (path === '/') {
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="chrome" data-solid={solid}>
      <Ticker />
      <header className="bar">
        <Brand />
        <nav className="bar__nav" aria-label="Principal">
          <button
            type="button"
            className="bar__link bar__link--mono"
            onClick={() => scrollToSection('catalogo')}
          >
            <span className="bar__num">01</span> Cartelera
          </button>
          <Link to="/eventos" className="bar__link bar__link--mono" aria-current={exploring ? 'page' : undefined}>
            <span className="bar__num">02</span> Explorar
          </Link>
          <button
            type="button"
            className="bar__link bar__link--mono"
            onClick={() => scrollToSection('categorias')}
          >
            <span className="bar__num">03</span> Sonidos
          </button>
          <button
            type="button"
            className="bar__link bar__link--mono"
            onClick={() => scrollToSection('peru')}
          >
            <span className="bar__num">04</span> Descubre el Perú
          </button>
        </nav>

        <div className="bar__actions">
          <div className="bar__city-picker">
            <Icon name="pin" size={15} className="bar__city-pin" />
            <select
              aria-label="Filtrar por ciudad del Perú"
              value={globalCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="bar__city-select"
            >
              {HEADER_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'TODAS' ? 'TODO EL PERÚ' : c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="bar__tickets-btn"
            onClick={() => setTicketsOpen(true)}
            aria-label={`Mis Entradas (${tickets.length})`}
          >
            <Icon name="ticket" size={17} />
            <span className="bar__tickets-label">Mis Entradas</span>
            <span className="bar__tickets-count">{tickets.length}</span>
          </button>

          <Link
            to={`/eventos${serializeFilters({ ...DEFAULT_FILTERS, saved: true })}`}
            className="icon-btn"
            aria-label={`Guardados (${saved.size})`}
          >
            <Icon name="heart" />
            {saved.size > 0 && <span className="badge badge--soft">{saved.size}</span>}
          </Link>

          <button
            type="button"
            className="icon-btn icon-btn--search"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar eventos"
          >
            <Icon name="search" />
            <span className="icon-btn__label">Buscar</span>
            <kbd className="kbd" aria-hidden="true">/</kbd>
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setCartOpen(true)}
            aria-label={`Carrito (${count} entradas)`}
          >
            <Icon name="bag" />
            {count > 0 && <span className="badge">{count}</span>}
          </button>
        </div>
      </header>
    </div>
  );
}

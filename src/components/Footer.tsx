import { GENRES } from '../data/events';
import { Link } from '../router';
import { DEFAULT_FILTERS, citiesWithCount, serializeFilters, upcoming } from '../lib/filters';
import { useStore } from '../lib/store';
import { PulseGlyph, Wordmark } from './Brand';

export function Footer() {
  const { events, now, setTicketsOpen } = useStore();
  const cities = citiesWithCount(upcoming(events, now));

  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__col">
          <p className="footer__h">Sonidos</p>
          <ul>
            {GENRES.map((g) => (
              <li key={g.id}>
                <Link to={`/eventos${serializeFilters({ ...DEFAULT_FILTERS, genre: g.id })}`}>{g.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer__col">
          <p className="footer__h">Ciudades</p>
          <ul>
            {cities.map(({ city, count }) => (
              <li key={city}>
                <Link to={`/eventos${serializeFilters({ ...DEFAULT_FILTERS, city })}`}>
                  {city} <span className="footer__count">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer__col">
          <p className="footer__h">AFORO Fusion</p>
          <ul>
            <li><Link to="/">Portada & Programación en pulso</Link></li>
            <li><Link to="/eventos">Explorar todos los conciertos</Link></li>
            <li><Link to={`/eventos${serializeFilters({ ...DEFAULT_FILTERS, when: 'weekend' })}`}>Este fin de semana</Link></li>
            <li><Link to={`/eventos${serializeFilters({ ...DEFAULT_FILTERS, saved: true })}`}>Tus guardados</Link></li>
            <li>
              <button type="button" className="footer__btn-link" onClick={() => setTicketsOpen(true)}>
                Mis Entradas (Billetera QR Demo)
              </button>
            </li>
          </ul>
        </div>

        <p className="footer__demo">
          <PulseGlyph size={22} className="footer__demo-glyph" />
          <span>
            <strong>Modo demostración · AFORO Fusion:</strong> los eventos, recintos, planos acústicos, precios y códigos QR son
            ficticios para el trabajo final de Arquitectura de Software; no hay pasarela de pagos ni venta real.
          </span>
        </p>
      </div>

      <div className="footer__mark" aria-hidden="true">
        <Wordmark />
      </div>

      <div className="wrap footer__base">
        <span>© 2026 AFORO — El pulso de lo que vivimos</span>
        <span>Perú · Arquitectura de Software</span>
      </div>
    </footer>
  );
}

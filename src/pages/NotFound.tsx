import { Link } from '../router';
import { Icon } from '../components/Icon';
import { useDocumentTitle } from '../lib/hooks';

export function NotFound({ title = 'Esta página se quedó sin aforo', text = 'No encontramos lo que buscas. Quizá el enlace cambió.' }: { title?: string; text?: string }) {
  useDocumentTitle('No encontrado · AFORO');
  return (
    <section className="notfound">
      <div className="wrap">
        <p className="notfound__code" aria-hidden="true">404</p>
        <h1 className="display display--lg">{title}</h1>
        <p className="notfound__text">{text}</p>
        <Link to="/eventos" className="btn btn--accent btn--lg">
          Explorar eventos <Icon name="arrow-right" size={20} />
        </Link>
      </div>
    </section>
  );
}

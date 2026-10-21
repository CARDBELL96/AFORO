import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando eventos…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="poster poster--skeleton" aria-hidden="true">
          <div className="poster__media skeleton" />
          <div className="poster__body">
            <div className="skeleton skeleton--line" style={{ width: '40%' }} />
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line" style={{ width: '30%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface StateProps {
  title: string;
  text: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export function EmptyState({ title, text, action, children }: StateProps) {
  return (
    <div className="state" role="status">
      <p className="state__big" aria-hidden="true">0</p>
      <h2 className="state__title">{title}</h2>
      <p className="state__text">{text}</p>
      {action && (
        <button type="button" className="btn btn--ghost" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <div className="state state--error" role="alert">
      <Icon name="alert" size={36} />
      <h2 className="state__title">No pudimos cargar los eventos</h2>
      <p className="state__text">
        Revisa tu conexión e inténtalo de nuevo.{message ? <span className="state__detail"> ({message})</span> : null}
      </p>
      <button type="button" className="btn btn--solid" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

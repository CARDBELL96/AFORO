import { Link } from '../router';

/** Trazo de pulso: el glifo de la marca. */
export function PulseGlyph({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size * 0.6} viewBox="0 0 60 36" fill="none" aria-hidden="true" focusable="false">
      <path d="M2 20h11l6-15 9 28 8-21 5 8h17" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Separador horizontal de sección con onda de pulso en el centro. */
export function PulseDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`pulse-divider ${className}`} aria-hidden="true">
      <span className="pulse-divider__line" />
      <PulseGlyph className="pulse-divider__glyph" size={34} />
      <span className="pulse-divider__line" />
    </div>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      AFOR<span className="wordmark__o">O</span>
    </span>
  );
}

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="AFORO - inicio">
      <PulseGlyph className="brand__glyph" size={30} />
      <Wordmark />
      <span className="brand__country">PE</span>
    </Link>
  );
}

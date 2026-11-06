import type { CSSProperties, ReactNode } from 'react';

/** Cinta de texto en bucle. La segunda copia está oculta a lectores de pantalla. */
export function Marquee({ items, className = '', seconds = 40 }: { items: ReactNode[]; className?: string; seconds?: number }) {
  const row = (hidden: boolean) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={i} className="marquee__item">
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee ${className}`} style={{ '--marquee-s': `${seconds}s` } as CSSProperties}>
      <div className="marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

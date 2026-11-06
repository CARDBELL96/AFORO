import { useEffect, useState } from 'react';
import type { EventImage } from '../data/events';
import { PulseGlyph } from './Brand';

interface PhotoProps {
  src?: string;
  image?: EventImage;
  alt?: string;
  position?: string;
  className?: string;
  eager?: boolean;
  mode?: 'photo' | 'poster';
  duotone?: boolean;
}

/**
 * Imagen resiliente con respaldo en cadena:
 * 1. Intenta cargar la fotografía real (`image.photo` o `src`).
 * 2. Si falla o no hay red, conmuta automáticamente al póster ilustrado local (`image.poster`).
 * 3. Si ambos fallan, muestra el bloque de marca con el glifo de pulso.
 */
export function Photo({
  src,
  image,
  alt = '',
  position,
  className = '',
  eager,
  mode = 'photo',
  duotone = false,
}: PhotoProps) {
  const primary = image ? (mode === 'poster' ? image.poster : image.photo) : src ?? '';
  const backup = image ? (mode === 'poster' ? image.photo : image.poster) : '';
  const resolvedAlt = image?.alt ?? alt;
  const resolvedPos = position ?? image?.position;

  const [stage, setStage] = useState<'primary' | 'backup' | 'failed'>('primary');

  useEffect(() => {
    setStage('primary');
  }, [primary, backup]);

  const currentSrc = stage === 'primary' ? primary : stage === 'backup' ? backup : '';

  if (stage === 'failed' || !currentSrc) {
    return (
      <div className={`photo photo--fallback ${className}`} role="img" aria-label={resolvedAlt}>
        <PulseGlyph size={64} />
      </div>
    );
  }

  return (
    <img
      className={`photo ${duotone ? 'photo--duotone' : ''} ${className}`}
      src={currentSrc}
      alt={resolvedAlt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      style={{ objectPosition: resolvedPos }}
      onError={() => {
        if (stage === 'primary' && backup && backup !== primary) {
          setStage('backup');
        } else {
          setStage('failed');
        }
      }}
    />
  );
}

import type { AforoEvent, TicketTier } from '../data/events';
import { formatPrice } from '../lib/format';

interface VenueStageMapProps {
  event: AforoEvent;
  selectedTierId: string;
  onSelectTier: (tierId: string) => void;
}

/**
 * Plano acústico interactivo del recinto (SVG).
 * Toma el diagrama espacial en trapecios de Gemini y lo tiñe dinámicamente con
 * el acento de color del evento (`var(--acc)`), sincronizado en ambas direcciones
 * con los botones accesibles por teclado y con el talón de entradas de Claude.
 */
export function VenueStageMap({ event, selectedTierId, onSelectTier }: VenueStageMapProps) {
  const tiers = event.tiers;
  const frontTier: TicketTier | undefined = tiers[0];
  const midTier: TicketTier | undefined = tiers[1];
  const upperTier: TicketTier | undefined = tiers[2];

  const getZoneStyle = (tier: TicketTier | undefined, isSelected: boolean) => {
    if (!tier || tier.status === 'sold_out') {
      return {
        fill: 'rgba(36, 38, 43, 0.55)',
        stroke: 'rgba(166, 166, 173, 0.25)',
        text: '#A6A6AD',
      };
    }
    if (isSelected) {
      return {
        fill: 'rgba(255, 85, 56, 0.26)',
        stroke: 'var(--acc)',
        text: '#F4F0E8',
      };
    }
    if (tier.status === 'few') {
      return {
        fill: 'rgba(216, 243, 106, 0.12)',
        stroke: '#D8F36A',
        text: '#D8F36A',
      };
    }
    return {
      fill: 'rgba(244, 240, 232, 0.06)',
      stroke: 'rgba(244, 240, 232, 0.32)',
      text: '#F4F0E8',
    };
  };

  const frontStyle = getZoneStyle(frontTier, selectedTierId === frontTier?.id);
  const midStyle = getZoneStyle(midTier, selectedTierId === midTier?.id);
  const upperStyle = getZoneStyle(upperTier, selectedTierId === upperTier?.id);

  return (
    <div className="aforo-stage-map" data-accent={event.accent} aria-label={`Mapa de sectores para ${event.venue}`}>
      <div className="aforo-stage-map__header">
        <div>
          <span className="aforo-mono-tag">PLANO ACÚSTICO DE RECINTO</span>
          <p className="aforo-stage-map__venue-name">
            {event.venue} · {event.city}
          </p>
        </div>
        <div className="aforo-stage-map__legend" aria-hidden="true">
          <span className="aforo-stage-map__legend-item">
            <i className="legend-swatch legend-swatch--selected" /> Activo
          </span>
          <span className="aforo-stage-map__legend-item">
            <i className="legend-swatch legend-swatch--lime" /> Últimos
          </span>
          <span className="aforo-stage-map__legend-item">
            <i className="legend-swatch legend-swatch--soldout" /> Agotado
          </span>
        </div>
      </div>

      <div className="aforo-stage-map__canvas">
        <svg aria-hidden="true" viewBox="0 0 560 360" className="aforo-stage-map__svg">
          {/* Líneas de eje y cobertura acústica */}
          <line x1="280" y1="10" x2="280" y2="350" stroke="rgba(244,240,232,0.07)" strokeDasharray="4 4" />
          <circle cx="280" cy="60" r="240" fill="none" stroke="rgba(244,240,232,0.05)" />
          <circle cx="280" cy="60" r="165" fill="none" stroke="rgba(244,240,232,0.06)" />

          {/* ESCENARIO / TARIMA PRINCIPAL */}
          <g>
            <path d="M 165 22 L 395 22 L 375 74 L 185 74 Z" fill="#101114" stroke="var(--acc)" strokeWidth="2" />
            <line x1="200" y1="30" x2="360" y2="30" stroke="#D8F36A" strokeWidth="2" />
            <text
              x="280"
              y="51"
              textAnchor="middle"
              fill="#F4F0E8"
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
              fontWeight="700"
              letterSpacing="2"
            >
              ESCENARIO // TARIMA PRINCIPAL
            </text>
            <text
              x="280"
              y="66"
              textAnchor="middle"
              fill="#A6A6AD"
              fontFamily="JetBrains Mono, monospace"
              fontSize="8.5"
            >
              L-ACOUSTICS LINE ARRAY · 102 dB SPL
            </text>
          </g>

          {/* ZONA 01: FRENTE / PISTA */}
          {frontTier && (
            <g
              className={`aforo-stage-map__zone ${
                frontTier.status === 'sold_out' ? 'is-disabled' : 'is-interactive'
              }`}
              onClick={() => {
                if (frontTier.status !== 'sold_out') onSelectTier(frontTier.id);
              }}
            >
              <path
                d="M 145 92 L 415 92 L 440 168 L 120 168 Z"
                fill={frontStyle.fill}
                stroke={frontStyle.stroke}
                strokeWidth={selectedTierId === frontTier.id ? '2.5' : '1.5'}
              />
              <text
                x="280"
                y="126"
                textAnchor="middle"
                fill={frontStyle.text}
                fontFamily="Big Shoulders Display, Inter Display, sans-serif"
                fontSize="19"
                fontWeight="800"
                letterSpacing="1"
              >
                01 · {frontTier.name.toUpperCase()}
              </text>
              <text
                x="280"
                y="148"
                textAnchor="middle"
                fill={frontStyle.text}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fontWeight="600"
              >
                {formatPrice(frontTier.price)} ·{' '}
                {frontTier.status === 'sold_out' ? 'AGOTADO' : `${frontTier.remaining}% LIBRE`}
              </text>
            </g>
          )}

          {/* ZONA 02: MEDIO / PLATEA */}
          {midTier && (
            <g
              className={`aforo-stage-map__zone ${
                midTier.status === 'sold_out' ? 'is-disabled' : 'is-interactive'
              }`}
              onClick={() => {
                if (midTier.status !== 'sold_out') onSelectTier(midTier.id);
              }}
            >
              <path
                d="M 105 182 L 455 182 L 485 260 L 75 260 Z"
                fill={midStyle.fill}
                stroke={midStyle.stroke}
                strokeWidth={selectedTierId === midTier.id ? '2.5' : '1.5'}
              />
              <text
                x="280"
                y="218"
                textAnchor="middle"
                fill={midStyle.text}
                fontFamily="Big Shoulders Display, Inter Display, sans-serif"
                fontSize="19"
                fontWeight="800"
                letterSpacing="1"
              >
                02 · {midTier.name.toUpperCase()}
              </text>
              <text
                x="280"
                y="240"
                textAnchor="middle"
                fill={midStyle.text}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fontWeight="600"
              >
                {formatPrice(midTier.price)} ·{' '}
                {midTier.status === 'sold_out' ? 'AGOTADO' : `${midTier.remaining}% LIBRE`}
              </text>
            </g>
          )}

          {/* ZONA 03: SUPERIOR / GALERÍA */}
          {upperTier ? (
            <g
              className={`aforo-stage-map__zone ${
                upperTier.status === 'sold_out' ? 'is-disabled' : 'is-interactive'
              }`}
              onClick={() => {
                if (upperTier.status !== 'sold_out') onSelectTier(upperTier.id);
              }}
            >
              <path
                d="M 65 274 L 495 274 L 515 340 L 45 340 Z"
                fill={upperStyle.fill}
                stroke={upperStyle.stroke}
                strokeWidth={selectedTierId === upperTier.id ? '2.5' : '1.5'}
              />
              <text
                x="280"
                y="306"
                textAnchor="middle"
                fill={upperStyle.text}
                fontFamily="Big Shoulders Display, Inter Display, sans-serif"
                fontSize="18"
                fontWeight="800"
                letterSpacing="1"
              >
                03 · {upperTier.name.toUpperCase()}
              </text>
              <text
                x="280"
                y="326"
                textAnchor="middle"
                fill={upperStyle.text}
                fontFamily="JetBrains Mono, monospace"
                fontSize="10.5"
                fontWeight="600"
              >
                {formatPrice(upperTier.price)} ·{' '}
                {upperTier.status === 'sold_out' ? 'SECTOR AGOTADO' : `${upperTier.remaining}% LIBRE`}
              </text>
            </g>
          ) : (
            <g>
              <rect
                x="185"
                y="282"
                width="190"
                height="46"
                fill="#101114"
                stroke="rgba(244,240,232,0.18)"
              />
              <text
                x="280"
                y="309"
                textAnchor="middle"
                fill="#A6A6AD"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
              >
                CONSOLA FOH & CONTROL LUMÍNICO
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Botones accesibles por teclado sincronizados con el mapa */}
      <div className="aforo-stage-map__quick-buttons" role="group" aria-label="Seleccionar sector del mapa">
        {tiers.map((t, idx) => {
          const isSelected = selectedTierId === t.id;
          const isSoldOut = t.status === 'sold_out';
          return (
            <button
              key={t.id}
              type="button"
              disabled={isSoldOut}
              onClick={() => onSelectTier(t.id)}
              className={`aforo-stage-map__pill ${isSelected ? 'is-selected' : ''} ${
                isSoldOut ? 'is-soldout' : ''
              }`}
            >
              <span className="aforo-stage-map__pill-num">0{idx + 1}</span>
              <span className="aforo-stage-map__pill-name">{t.name}</span>
              <span className="aforo-stage-map__pill-price">{formatPrice(t.price)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

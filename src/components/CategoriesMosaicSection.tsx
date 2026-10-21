import type { AforoEvent, GenreId } from '../data/events';
import { EDITORIAL_CATEGORIES, type EditorialCategory } from '../data/editorial';
import { upcoming } from '../lib/filters';
import { useStore } from '../lib/store';
import { Photo } from './Photo';

interface CategoriesMosaicSectionProps {
  selectedCategory: GenreId | 'TODAS';
  onSelectCategory: (category: GenreId | 'TODAS') => void;
}

export function CategoriesMosaicSection({
  selectedCategory,
  onSelectCategory,
}: CategoriesMosaicSectionProps) {
  const { events, now } = useStore();
  const pool: AforoEvent[] = upcoming(events, now);

  const getCategoryEventCount = (catId: GenreId) =>
    pool.filter((ev) => ev.genre === catId).length;

  const handleCategoryClick = (cat: EditorialCategory) => {
    const nextValue = selectedCategory === cat.id ? 'TODAS' : cat.id;
    onSelectCategory(nextValue);
    const catalogEl = document.getElementById('catalogo');
    if (catalogEl && nextValue !== 'TODAS') {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="categorias"
      className="aforo-section aforo-categories"
      aria-labelledby="categories-heading"
    >
      <div className="wrap">
        <div className="aforo-section__header">
          <div className="aforo-section__header-left">
            <span className="aforo-section__index">02 // TAXONOMÍA SONORA</span>
            <h2 id="categories-heading" className="aforo-section__title">
              SEIS MOVIMIENTOS QUE MUEVEN LA ESCENA
            </h2>
          </div>
          <div className="aforo-section__header-right">
            <p className="aforo-section__subtitle">
              De la psicodelia amazónica y el rock volcánico del sur a los domos de electrónica
              e instalaciones en casonas históricas. Selecciona una frecuencia para filtrar la
              cartelera.
            </p>
            {selectedCategory !== 'TODAS' && (
              <button
                type="button"
                onClick={() => onSelectCategory('TODAS')}
                className="aforo-link-reset"
              >
                Ver todas las categorías ×
              </button>
            )}
          </div>
        </div>

        <div className="aforo-categories__mosaic">
          {EDITORIAL_CATEGORIES.map((cat) => {
            const count = getCategoryEventCount(cat.id);
            const isSelected = selectedCategory === cat.id;

            return (
              <article
                key={cat.id}
                data-accent={cat.accent}
                className={`aforo-cat-card aforo-cat-card--${cat.gridSpanClass} ${
                  isSelected ? 'is-selected' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  className="aforo-cat-card__trigger"
                  aria-pressed={isSelected}
                >
                  <div className="aforo-cat-card__media">
                    <Photo image={cat.image} mode="photo" duotone className="aforo-cat-card__img" />
                    <div className="aforo-cat-card__overlay" aria-hidden="true" />
                  </div>

                  <div className="aforo-cat-card__content">
                    <div className="aforo-cat-card__top">
                      <span className="aforo-cat-card__index">[{cat.index}]</span>
                      <span className="aforo-cat-card__descriptor">{cat.sonicDescriptor}</span>
                      <span className="aforo-cat-card__count">
                        {count} {count === 1 ? 'FECHA DEMO' : 'FECHAS DEMO'}
                      </span>
                    </div>

                    <div className="aforo-cat-card__bottom">
                      <h3 className="aforo-cat-card__title">{cat.title}</h3>
                      <p className="aforo-cat-card__subtitle">{cat.subtitle}</p>

                      <div className="aforo-cat-card__footer">
                        <div className="aforo-cat-card__samples">
                          {cat.featuredArtistsSample.map((artist) => (
                            <span key={artist} className="aforo-cat-card__sample-pill">
                              {artist}
                            </span>
                          ))}
                        </div>
                        <span className="aforo-cat-card__action">
                          {isSelected ? 'Filtro activo ✓' : 'Explorar →'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS } from '../data/events';
import { DEFAULT_FILTERS, citiesWithCount, filterEvents, minPrice, normalize, parseFilters, serializeFilters, upcoming } from './filters';

const NOW = new Date('2026-10-16T12:00:00-05:00');
const slugs = (list: { slug: string }[]) => list.map((e) => e.slug);

test('normalize quita tildes y mayúsculas', () => {
  assert.equal(normalize('  Máncora Sótano '), 'mancora sotano');
});

test('la búsqueda ignora tildes y mayúsculas, y busca en ciudad, título y line-up', () => {
  assert.ok(slugs(filterEvents(EVENTS, { ...DEFAULT_FILTERS, q: 'SOTANO' }, NOW)).includes('sotano-distorsion'));
  assert.ok(slugs(filterEvents(EVENTS, { ...DEFAULT_FILTERS, q: 'mancora' }, NOW)).includes('tropicalia-sunset'));
  assert.ok(slugs(filterEvents(EVENTS, { ...DEFAULT_FILTERS, q: 'dj quilla' }, NOW)).includes('altiplano-sound'));
  assert.equal(filterEvents(EVENTS, { ...DEFAULT_FILTERS, q: 'zzzz' }, NOW).length, 0);
});

test('filtra por género y ciudad', () => {
  const rock = filterEvents(EVENTS, { ...DEFAULT_FILTERS, genre: 'rock-indie' }, NOW);
  assert.deepEqual(slugs(rock).sort(), ['marea-baja', 'sotano-distorsion', 'volcan-en-frecuencia']);
  const lima = filterEvents(EVENTS, { ...DEFAULT_FILTERS, city: 'Lima' }, NOW);
  assert.ok(lima.length >= 6 && lima.every((e) => e.city === 'Lima'));
});

test('el precio máximo usa la entrada disponible más barata', () => {
  const cheap = slugs(filterEvents(EVENTS, { ...DEFAULT_FILTERS, maxPrice: 50 }, NOW));
  assert.ok(cheap.includes('sotano-distorsion'));
  assert.ok(!cheap.includes('pulso-festival'));
  const altiplano = EVENTS.find((e) => e.slug === 'altiplano-sound')!;
  assert.equal(minPrice(altiplano), 120); // la preventa de 90 está agotada
});

test('ordena por fecha y por precio', () => {
  const byDate = filterEvents(EVENTS, DEFAULT_FILTERS, NOW);
  assert.equal(byDate[0]?.slug, 'noche-de-salsa-dura');
  const asc = filterEvents(EVENTS, { ...DEFAULT_FILTERS, sort: 'price-asc' }, NOW).map(minPrice);
  assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
  const desc = filterEvents(EVENTS, { ...DEFAULT_FILTERS, sort: 'price-desc' }, NOW).map(minPrice);
  assert.deepEqual(desc, [...desc].sort((a, b) => b - a));
});

test('los eventos pasados no aparecen', () => {
  assert.equal(upcoming(EVENTS, new Date('2027-03-01T00:00:00-05:00')).length, 0);
  const afterSalsa = upcoming(EVENTS, new Date('2026-10-31T12:00:00-05:00'));
  assert.ok(!slugs(afterSalsa).includes('noche-de-salsa-dura'));
});

test('el filtro de fines de semana excluye los eventos entre semana', () => {
  const weekend = slugs(filterEvents(EVENTS, { ...DEFAULT_FILTERS, when: 'weekend' }, NOW));
  assert.ok(weekend.includes('noche-de-salsa-dura')); // viernes
  assert.ok(!weekend.includes('noche-de-teatro')); // jueves
});

test('el filtro de próximos 30 días respeta la fecha actual', () => {
  const next30 = slugs(filterEvents(EVENTS, { ...DEFAULT_FILTERS, when: '30d' }, NOW));
  assert.ok(next30.includes('noche-de-salsa-dura'));
  assert.ok(!next30.includes('pulso-festival'));
});

test('solo guardados', () => {
  const saved = filterEvents(EVENTS, { ...DEFAULT_FILTERS, saved: true }, NOW, new Set(['ev-002']));
  assert.deepEqual(slugs(saved), ['cumbia-cosmica']);
});

test('ciudades con conteo, ordenadas por cantidad', () => {
  const cities = citiesWithCount(EVENTS);
  assert.equal(cities[0]?.city, 'Lima');
  assert.ok((cities[0]?.count ?? 0) >= 6);
});

test('URL ⇄ filtros es reversible y descarta valores inválidos', () => {
  const f = {
    ...DEFAULT_FILTERS,
    q: 'rock',
    genre: 'electronica' as const,
    city: 'Cusco',
    when: '90d' as const,
    maxPrice: 100,
    sort: 'price-asc' as const,
    saved: true,
    onlyAvailable: true,
    monthKey: '2026-11',
  };
  assert.deepEqual(parseFilters(serializeFilters(f)), f);
  assert.equal(serializeFilters(DEFAULT_FILTERS), '');
  assert.deepEqual(parseFilters('?genero=inventado&cuando=nunca&orden=azar&max=-3'), DEFAULT_FILTERS);
});

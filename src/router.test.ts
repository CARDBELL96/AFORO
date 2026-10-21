import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRoute, parseRouteLocation, resolveLinkAttrs } from './router';

test('resuelve las rutas conocidas', () => {
  assert.deepEqual(matchRoute('/'), { name: 'home' });
  assert.deepEqual(matchRoute('/eventos'), { name: 'events' });
  assert.deepEqual(matchRoute('/eventos/'), { name: 'events' });
  assert.deepEqual(matchRoute('/eventos/pulso-festival'), { name: 'event', slug: 'pulso-festival' });
  assert.deepEqual(matchRoute('/eventos/pulso-festival#entradas'), {
    name: 'event',
    slug: 'pulso-festival',
  });
});

test('lo desconocido es 404', () => {
  assert.deepEqual(matchRoute('/nada'), { name: 'notfound' });
  assert.deepEqual(matchRoute('/eventos/a/b'), { name: 'notfound' });
  assert.deepEqual(matchRoute('/eventos/MAYUS'), { name: 'notfound' });
});

test('parseRouteLocation separa path, search y hash (#entradas)', () => {
  assert.deepEqual(parseRouteLocation('/eventos/los-mirlos-lima#entradas'), {
    path: '/eventos/los-mirlos-lima',
    search: '',
    hash: '#entradas',
  });
  assert.deepEqual(parseRouteLocation('/eventos?ciudad=Lima#entradas'), {
    path: '/eventos',
    search: '?ciudad=Lima',
    hash: '#entradas',
  });
  assert.deepEqual(parseRouteLocation('/eventos/los-mirlos-lima'), {
    path: '/eventos/los-mirlos-lima',
    search: '',
    hash: '',
  });
});

test('resolveLinkAttrs garantiza target="_blank" y rel="noopener noreferrer" en nueva pestaña', () => {
  const viewEvent = resolveLinkAttrs({ to: '/eventos/los-mirlos-lima', newTab: true });
  assert.equal(viewEvent.href, '/eventos/los-mirlos-lima');
  assert.equal(viewEvent.target, '_blank');
  assert.equal(viewEvent.rel, 'noopener noreferrer');
  assert.equal(viewEvent.opensInNewTab, true);

  const buyTickets = resolveLinkAttrs({ to: '/eventos/los-mirlos-lima#entradas', newTab: true });
  assert.equal(buyTickets.href, '/eventos/los-mirlos-lima#entradas');
  assert.equal(buyTickets.target, '_blank');
  assert.equal(buyTickets.rel, 'noopener noreferrer');
  assert.equal(buyTickets.opensInNewTab, true);

  const sameTab = resolveLinkAttrs({ to: '/eventos' });
  assert.equal(sameTab.target, undefined);
  assert.equal(sameTab.rel, undefined);
  assert.equal(sameTab.opensInNewTab, false);
});

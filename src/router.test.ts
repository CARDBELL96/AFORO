import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRoute } from './router';

test('resuelve las rutas conocidas', () => {
  assert.deepEqual(matchRoute('/'), { name: 'home' });
  assert.deepEqual(matchRoute('/eventos'), { name: 'events' });
  assert.deepEqual(matchRoute('/eventos/'), { name: 'events' });
  assert.deepEqual(matchRoute('/eventos/pulso-festival'), { name: 'event', slug: 'pulso-festival' });
});

test('lo desconocido es 404', () => {
  assert.deepEqual(matchRoute('/nada'), { name: 'notfound' });
  assert.deepEqual(matchRoute('/eventos/a/b'), { name: 'notfound' });
  assert.deepEqual(matchRoute('/eventos/MAYUS'), { name: 'notfound' });
});

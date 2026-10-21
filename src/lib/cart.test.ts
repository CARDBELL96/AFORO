import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS } from '../data/events';
import { MAX_PER_TIER, addLine, cartCount, cartTotal, removeLine, resolveLines, sanitizeLines, setQty } from './cart';

test('agregar suma cantidades de la misma entrada', () => {
  let lines = addLine([], 'ev-002', 'gral');
  lines = addLine(lines, 'ev-002', 'gral', 2);
  assert.deepEqual(lines, [{ eventId: 'ev-002', tierId: 'gral', qty: 3 }]);
});

test('la cantidad por entrada tiene un tope', () => {
  const lines = setQty([], 'ev-002', 'gral', 99);
  assert.equal(lines[0]?.qty, MAX_PER_TIER);
});

test('cantidad 0 o menor elimina la línea', () => {
  const lines = addLine([], 'ev-002', 'gral', 2);
  assert.deepEqual(setQty(lines, 'ev-002', 'gral', 0), []);
  assert.deepEqual(removeLine(lines, 'ev-002', 'gral'), []);
});

test('el total suma precio × cantidad', () => {
  let lines = addLine([], 'ev-002', 'gral', 2); // 70 × 2
  lines = addLine(lines, 'ev-004', 'butaca', 1); // 130
  assert.equal(cartTotal(lines, EVENTS), 270);
  assert.equal(cartCount(lines), 3);
});

test('las entradas agotadas o inexistentes no cuentan', () => {
  const lines = [
    { eventId: 'ev-001', tierId: 'vip', qty: 2 }, // agotada
    { eventId: 'ev-xxx', tierId: 'gral', qty: 1 }, // evento inexistente
    { eventId: 'ev-001', tierId: 'dia', qty: 1 },
  ];
  assert.equal(resolveLines(lines, EVENTS).length, 1);
  assert.equal(cartTotal(lines, EVENTS), 149);
});

test('sanitizeLines descarta datos corruptos', () => {
  assert.deepEqual(sanitizeLines('basura'), []);
  assert.deepEqual(sanitizeLines([{ eventId: 1 }, null, { eventId: 'a', tierId: 'b', qty: 2 }, { eventId: 'a', tierId: 'c', qty: -1 }]), [
    { eventId: 'a', tierId: 'b', qty: 2 },
  ]);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateLabel, dayParts, formatPrice, formatTime, limaWeekday } from './format';

test('formatPrice usa soles', () => {
  assert.equal(formatPrice(149), 'S/ 149');
  assert.equal(formatPrice(49.5), 'S/ 49.50');
});

test('las fechas se muestran en hora de Lima, no en UTC', () => {
  // 02:00 UTC del 22 = 21:00 del 21 en Lima
  const p = dayParts('2026-11-22T02:00:00Z');
  assert.equal(p.day, '21');
  assert.equal(p.month, 'NOV');
  assert.equal(p.weekday, 'SÁB');
  assert.equal(formatTime('2026-11-22T02:00:00Z'), '21:00');
});

test('límites de día', () => {
  assert.equal(formatTime('2026-11-21T00:05:00-05:00'), '00:05');
  assert.equal(limaWeekday('2026-11-21T21:00:00-05:00'), 6);
});

test('dateLabel para eventos de varios días', () => {
  assert.equal(dateLabel({ startsAt: '2026-12-12T17:00:00-05:00', endsAt: '2026-12-14T23:30:00-05:00' }), '12–14 DIC');
  assert.equal(dateLabel({ startsAt: '2026-11-21T21:00:00-05:00' }), '21 NOV');
});

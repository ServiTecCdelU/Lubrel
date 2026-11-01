import assert from 'node:assert/strict';
import { contarNoLeidas } from './no-leidas';

const items = [{ createdAt: '2026-11-01T10:00:00Z' }, { createdAt: '2026-11-01T12:00:00Z' }];

test('contarNoLeidas: sin fecha guardada cuenta todas', () => {
  assert.equal(contarNoLeidas(items, undefined), 2);
});

test('contarNoLeidas: cuenta solo las posteriores a la última vez vista', () => {
  assert.equal(contarNoLeidas(items, '2026-11-01T11:00:00Z'), 1);
  assert.equal(contarNoLeidas(items, '2026-11-01T13:00:00Z'), 0);
});

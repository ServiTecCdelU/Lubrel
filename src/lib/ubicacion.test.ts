import assert from 'node:assert/strict';
import { ciudadMasCercana, distanciaKm } from './ubicacion';

jest.mock('expo', () => ({ requireOptionalNativeModule: () => null }));

const ciudades = [
  { provincia: 'Entre Ríos', ciudad: 'Concepción del Uruguay', lat: -32.4846, lon: -58.2321 },
  { provincia: 'Entre Ríos', ciudad: 'Colón', lat: -32.2233, lon: -58.1426 },
  { provincia: 'Entre Ríos', ciudad: 'Sin centro', lat: null, lon: null },
];

test('distancia aproximada entre C. del Uruguay y Colón', () => {
  const d = distanciaKm(-32.4846, -58.2321, -32.2233, -58.1426);
  assert.ok(d > 25 && d < 35, String(d));
});

test('elige la más cercana dentro del radio', () => {
  assert.equal(ciudadMasCercana(ciudades, -32.48, -58.24)?.ciudad, 'Concepción del Uruguay');
  assert.equal(ciudadMasCercana(ciudades, -32.23, -58.15)?.ciudad, 'Colón');
});

test('lejos de todas: ninguna', () => {
  assert.equal(ciudadMasCercana(ciudades, -31.73, -60.52), null);
});

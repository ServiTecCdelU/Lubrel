import assert from 'node:assert/strict';
import { CADA_CUANTO, useOpinionesStore } from './opiniones';

jest.mock('@/lib/almacen', () => ({ almacen: { getItem: () => null, setItem: () => {}, removeItem: () => {} } }));

const reset = () => useOpinionesStore.setState({ pedidosEnviados: 0, ultimaPregunta: null, calificoEnPlay: false, pendiente: null });

test('pregunta al completar el segundo pedido, no antes', () => {
  reset();
  useOpinionesStore.getState().registrarPedido();
  assert.equal(useOpinionesStore.getState().pendiente, null);
  useOpinionesStore.getState().registrarPedido();
  assert.equal(useOpinionesStore.getState().pendiente, 'segundo_pedido');
});

test('cada tanto pide calificar, salvo si ya calificó en Play o preguntó hace poco', () => {
  reset();
  useOpinionesStore.setState({ pedidosEnviados: 5, ultimaPregunta: 1000 });
  useOpinionesStore.getState().revisarPeriodica(1000 + CADA_CUANTO - 1);
  assert.equal(useOpinionesStore.getState().pendiente, null);
  useOpinionesStore.getState().revisarPeriodica(1000 + CADA_CUANTO);
  assert.equal(useOpinionesStore.getState().pendiente, 'periodico');
  useOpinionesStore.getState().marcarCalificoEnPlay();
  useOpinionesStore.getState().revisarPeriodica(Number.MAX_SAFE_INTEGER);
  assert.equal(useOpinionesStore.getState().pendiente, null);
});

import assert from 'node:assert/strict';
import { cambioDeProyecto, configDeRespuesta, configValida, elegirConfig, leerGuardada } from './config-supabase';

const canada = { url: 'https://zhxinuvrnfgwwnlvthas.supabase.co', key: 'sb_publishable_canada_123456789' };
const saoPaulo = { url: 'https://ltxkynjghykbyxtcobsj.supabase.co', key: 'sb_publishable_saopaulo_12345678' };

test('configValida: exige URL https sin ruta y una clave de largo razonable', () => {
  assert.equal(configValida(canada), true);
  assert.equal(configValida({ url: 'http://zhx.supabase.co', key: canada.key }), false);
  assert.equal(configValida({ url: 'https://zhx.supabase.co/rest/v1', key: canada.key }), false);
  assert.equal(configValida({ url: canada.url, key: 'corta' }), false);
  assert.equal(configValida(null), false);
  assert.equal(configValida('texto'), false);
});

test('elegirConfig: usa la última que mandó el servidor y, si no hay o está rota, la del build', () => {
  assert.deepEqual(elegirConfig(saoPaulo, canada), saoPaulo);
  assert.deepEqual(elegirConfig(null, canada), canada);
  assert.deepEqual(elegirConfig({ url: 'basura' }, canada), canada);
});

test('leerGuardada: tolera vacío y JSON roto', () => {
  assert.deepEqual(leerGuardada(JSON.stringify(saoPaulo)), saoPaulo);
  assert.equal(leerGuardada(null), null);
  assert.equal(leerGuardada('{roto'), null);
});

test('configDeRespuesta: toma { data: { supabaseUrl, supabaseKey } } y descarta lo inválido', () => {
  assert.deepEqual(configDeRespuesta({ data: { supabaseUrl: saoPaulo.url, supabaseKey: saoPaulo.key } }), saoPaulo);
  assert.equal(configDeRespuesta({ error: 'Configuración no disponible' }), null);
  assert.equal(configDeRespuesta({ data: { supabaseUrl: 'http://x', supabaseKey: saoPaulo.key } }), null);
  assert.equal(configDeRespuesta(null), null);
});

test('cambioDeProyecto: detecta la mudanza y no se confunde por una barra final', () => {
  assert.equal(cambioDeProyecto(canada, saoPaulo), true);
  assert.equal(cambioDeProyecto(canada, { ...canada }), false);
  assert.equal(cambioDeProyecto(canada, { ...canada, url: canada.url + '/' }), false);
  assert.equal(cambioDeProyecto(canada, { ...canada, key: 'sb_publishable_otra_clave_1234' }), true);
});

import assert from 'node:assert/strict';
import { iconoRubro } from './icono-rubro';

test('iconoRubro: el rubro manda cuando dice qué es', () => {
  assert.equal(iconoRubro('FIAMBRES', 'FETEADO TRES PALOS KG'), 'sausage');
  assert.equal(iconoRubro('LIMPIEZA', 'L-AROM ENCANTO VAINILLA X 360 CC.'), 'spray-bottle');
  assert.equal(iconoRubro('GALLETITAS', 'OPERA X 92G'), 'cookie');
  assert.equal(iconoRubro('VINOS', 'TORO TINTO 1L'), 'glass-wine');
});

test('iconoRubro: con rubro genérico se mira el nombre', () => {
  assert.equal(iconoRubro('ALMACEN', 'L-HARINA KG'), 'basket');
  assert.equal(iconoRubro('Sin categoria', 'VELA 4U LARGA ROJA ASTRO'), 'lightbulb-outline');
  assert.equal(iconoRubro('FRESCOS', 'QUESO CREMOSO KG LAYNA'), 'cheese');
  assert.equal(iconoRubro('FRESCOS', 'CUARTO POLLO FADEL GRANEL KG'), 'food-drumstick');
});

test('iconoRubro: PAN no se confunde con palabras que empiezan igual', () => {
  assert.equal(iconoRubro('', 'PAN LACTAL X 400G'), 'baguette');
  assert.notEqual(iconoRubro('', 'PANTALLA LED'), 'baguette');
});

test('iconoRubro: sin datos usa la caja', () => {
  assert.equal(iconoRubro(null, null), 'package-variant-closed');
  assert.equal(iconoRubro('LICITACION', 'XJ-2201'), 'package-variant-closed');
});

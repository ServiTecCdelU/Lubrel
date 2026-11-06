import { origenDe } from './origen-pedido';

describe('origenDe', () => {
  it('usa el origen que manda el servidor', () => {
    expect(origenDe({ origen: 'tienda', desdeApp: false }).etiqueta).toBe('Tienda online');
    expect(origenDe({ origen: 'vendedor', desdeApp: false }).etiqueta).toBe('Vendedor');
    expect(origenDe({ origen: 'distribuidora', desdeApp: false }).etiqueta).toBe('Distribuidora');
  });
  it('con un servidor viejo (sin origen) cae a app o vendedor', () => {
    expect(origenDe({ desdeApp: true }).etiqueta).toBe('App');
    expect(origenDe({ desdeApp: false }).etiqueta).toBe('Vendedor');
  });
});

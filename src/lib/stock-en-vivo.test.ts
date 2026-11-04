import { esConsultaDeStock } from './stock-en-vivo';

describe('esConsultaDeStock', () => {
  it('relee catálogo, ofertas y cotización de la distribuidora que avisó', () => {
    expect(esConsultaDeStock(['catalogo', 'demo', '', '', false, false, null, 1], 'demo')).toBe(true);
    expect(esConsultaDeStock(['ofertas', 'demo'], 'demo')).toBe(true);
    expect(esConsultaDeStock(['cotizacion', 'demo', 'x'], 'demo')).toBe(true);
  });

  it('no toca otras distribuidoras ni consultas sin stock', () => {
    expect(esConsultaDeStock(['catalogo', 'otra'], 'demo')).toBe(false);
    expect(esConsultaDeStock(['pedidos', 'demo'], 'demo')).toBe(false);
    expect(esConsultaDeStock(['me'], 'demo')).toBe(false);
  });
});

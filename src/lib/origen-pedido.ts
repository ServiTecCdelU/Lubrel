// De dónde vino el pedido (lo manda el servidor en `origen`): se muestra en Mis pedidos y en
// el detalle. Un servidor viejo solo manda `desdeApp`: el resto se toma como del vendedor.
import type { PedidoResumen } from '@/lib/tipos';

export type OrigenPedido = 'app' | 'tienda' | 'vendedor' | 'distribuidora';

const ORIGENES: Record<OrigenPedido, { etiqueta: string }> = {
  app: { etiqueta: 'App' },
  tienda: { etiqueta: 'Tienda online' },
  vendedor: { etiqueta: 'Vendedor' },
  distribuidora: { etiqueta: 'Distribuidora' },
};

export function origenDe(p: Pick<PedidoResumen, 'origen' | 'desdeApp'>): { etiqueta: string } {
  const origen: OrigenPedido = p.origen && p.origen in ORIGENES ? p.origen : p.desdeApp ? 'app' : 'vendedor';
  return ORIGENES[origen];
}

import { Insignia } from '@/components/ui';
import { origenDe } from '@/lib/origen-pedido';
import type { EstadoPedido, PedidoResumen } from '@/lib/tipos';
import { colors } from '@/theme';

export const ESTADOS: { clave: EstadoPedido; titulo: string; detalle: string }[] = [
  { clave: 'recibido', titulo: 'Recibido', detalle: 'La distribuidora ya tiene tu pedido' },
  { clave: 'preparando', titulo: 'Preparando', detalle: 'Lo están armando; ya no se puede editar' },
  { clave: 'en_camino', titulo: 'En reparto', detalle: 'Salió con el reparto de tu zona' },
  { clave: 'entregado', titulo: 'Entregado', detalle: 'Llegó a tu comercio' },
];

// Mismos colores que los estados de Pedidos en el panel (teal / amber / sky / emerald).
const ESTILO: Record<EstadoPedido, { texto: string; bg: string; fg: string; borde: string }> = {
  recibido: { texto: 'Recibido', bg: colors.tealSoft, fg: colors.tealInk, borde: colors.tealLine },
  preparando: { texto: 'Preparando', bg: colors.amberSoft, fg: colors.amberInk, borde: colors.warnLine },
  en_camino: { texto: 'En reparto', bg: '#f0f9ff', fg: '#0369a1', borde: '#bae6fd' },
  entregado: { texto: 'Entregado', bg: colors.okSoft, fg: colors.okInk, borde: '#a7f3d0' },
  cancelado: { texto: 'Cancelado', bg: colors.lineSoft, fg: colors.muted, borde: colors.line },
};

export function EstadoPedidoInsignia({ estado, retenido }: { estado: EstadoPedido; retenido?: boolean }) {
  if (retenido && estado === 'recibido') {
    return <Insignia texto="En revisión" bg={colors.amberSoft} fg={colors.amberInk} borde={colors.warnLine} />;
  }
  const e = ESTILO[estado];
  return <Insignia texto={e.texto} bg={e.bg} fg={e.fg} borde={e.borde} />;
}

/** De dónde vino el pedido (App, Tienda online, Vendedor o Distribuidora), en gris. */
export function OrigenChip({ pedido }: { pedido: Pick<PedidoResumen, 'origen' | 'desdeApp'> }) {
  return <Insignia texto={origenDe(pedido).etiqueta} bg={colors.lineSoft} fg={colors.muted} borde={colors.line} />;
}

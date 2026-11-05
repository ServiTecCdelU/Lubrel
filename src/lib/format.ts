const ars = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const arsDec = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** $ 38.400 (sin decimales si es entero). */
export function precio(n: number): string {
  return `$ ${Number.isInteger(n) ? ars.format(n) : arsDec.format(n)}`;
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' });
}

export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Unidad de venta de la línea. Mismo criterio que el precio de lote del SaaS
 * (lib/pricing.precioLote): con `se_divide_en`, se vende de a ese pack; si no, el bulto.
 */
/** "Pieza aprox 2,5 kg", o null si el producto no lo tiene. */
export function pesoAprox(kg: number | null | undefined): string | null {
  if (kg == null || !Number.isFinite(kg) || kg <= 0) return null;
  return `Pieza aprox ${String(Math.round(kg * 1000) / 1000).replace('.', ',')} kg`;
}

export function presentacion(unidadesPorBulto: number | null, seDivideEn: number | null): string {
  if (seDivideEn && seDivideEn > 1) return `Pack x ${seDivideEn}`;
  if (unidadesPorBulto && unidadesPorBulto > 1) return `Bulto x ${unidadesPorBulto}`;
  return 'Unidad';
}

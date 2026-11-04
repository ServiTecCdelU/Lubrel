// Stock en vivo: qué consultas se vuelven a pedir cuando la distribuidora avisa que se
// movió stock (carga de boleta, venta, ajuste). Son las que muestran "Sin stock" o
// "Ya no está disponible": catálogo, ofertas, más elegidos, destacados y la cotización
// del carrito. Ver src/hooks/use-stock-en-vivo.ts.

const CON_STOCK = new Set(['catalogo', 'ofertas', 'mas-elegidos', 'destacados', 'cotizacion']);

export function esConsultaDeStock(queryKey: readonly unknown[], slug: string): boolean {
  return CON_STOCK.has(String(queryKey[0])) && queryKey[1] === slug;
}

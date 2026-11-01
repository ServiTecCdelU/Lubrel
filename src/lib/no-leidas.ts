// Cuántos avisos de "Notificaciones" son posteriores a la última vez que se abrió la pantalla.
export function contarNoLeidas(items: readonly { createdAt: string }[], vistasHasta: string | undefined): number {
  if (!vistasHasta) return items.length;
  const corte = Date.parse(vistasHasta);
  return items.filter((n) => Date.parse(n.createdAt) > corte).length;
}

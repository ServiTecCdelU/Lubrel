// Secciones opcionales que la distribuidora prende o apaga en el panel (App Vendedor 24/7 →
// General). Espejo de SaaS lib/app-pedidos/secciones.ts: sección nueva, misma clave en los dos.
// Lo que no viene (servidor viejo, sin señal) se muestra.
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { useComercioPublico } from '@/lib/queries';
import type { SeccionApp } from '@/lib/tipos';

export function useSecciones(): Record<SeccionApp, boolean> {
  const { slug } = useComercioActivo();
  const guardadas = useComercioPublico(slug ?? undefined).data?.secciones ?? {};
  const ver = (s: SeccionApp) => guardadas[s] !== false;
  return {
    ofertas: ver('ofertas'),
    masElegidos: ver('masElegidos'),
    destacados: ver('destacados'),
    favoritos: ver('favoritos'),
    escanear: ver('escanear'),
    repetirPedido: ver('repetirPedido'),
  };
}

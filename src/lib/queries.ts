// Hooks de datos (TanStack Query) sobre /api/app/v1.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { APP_ID } from '@/lib/tienda';
import type { VersionPublicada } from '@/lib/version-app';
import type {
  CiudadApp,
  Comercio,
  Cotizacion,
  Cuenta,
  DatosComercio,
  InformarPago,
  Me,
  PaginaCatalogo,
  PedidoCreado,
  OfertaApp,
  PedidoResumen,
  ProductoApp,
} from '@/lib/tipos';

const PAGE_SIZE = 20;

export const qk = {
  me: ['me'] as const,
  comercio: (slug: string) => ['comercio', slug] as const,
  catalogo: (slug: string, q: string, rubro: string) => ['catalogo', slug, q, rubro] as const,
  rubros: (slug: string) => ['rubros', slug] as const,
  ciudades: (slug: string) => ['ciudades', slug] as const,
  ofertas: (slug: string) => ['ofertas', slug] as const,
  masElegidos: (slug: string) => ['mas-elegidos', slug] as const,
  destacados: (slug: string) => ['destacados', slug] as const,
  cotizacion: (slug: string, clave: string) => ['cotizacion', slug, clave] as const,
  pedidos: (slug: string) => ['pedidos', slug] as const,
  cuenta: (slug: string) => ['cuenta', slug] as const,
  version: (app: string) => ['version', app] as const,
};

export function useMe(enabled = true) {
  return useQuery({ queryKey: qk.me, queryFn: () => api<Me>('/me'), enabled });
}

/** Marca pública de la distribuidora (pantalla de invitación, sin sesión). */
export function useComercioPublico(slug: string | undefined) {
  return useQuery({
    queryKey: qk.comercio(slug ?? ''),
    queryFn: () => api<Omit<Comercio, never>>(`/comercios/${encodeURIComponent(slug!)}`, { auth: false }),
    enabled: !!slug,
    retry: false,
  });
}

/** `favoritos`: si viene, el catálogo se limita a esos ids (los favoritos del dispositivo). */
export function useCatalogo(slug: string, q: string, rubro: string, soloOfertas = false, masPedidos = false, favoritos?: string[]) {
  return useInfiniteQuery({
    queryKey: [...qk.catalogo(slug, q, rubro), soloOfertas, masPedidos, favoritos?.join(',') ?? null],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), pageSize: String(PAGE_SIZE) });
      if (q) params.set('q', q);
      if (rubro) params.set('rubro', rubro);
      if (soloOfertas) params.set('soloOfertas', '1');
      if (masPedidos) params.set('masPedidos', '1');
      if (favoritos) params.set('ids', favoritos.join(','));
      return api<PaginaCatalogo>(`/comercios/${slug}/catalogo?${params}`, { auth: 'opcional' });
    },
    getNextPageParam: (ultima) => (ultima.page < ultima.totalPages ? ultima.page + 1 : undefined),
  });
}

export function useOfertas(slug: string) {
  return useQuery({
    queryKey: qk.ofertas(slug),
    queryFn: () => api<OfertaApp[]>(`/comercios/${slug}/ofertas`, { auth: 'opcional' }),
    staleTime: 5 * 60_000,
  });
}

/** "Los más elegidos": los más vendidos de la distribuidora (todos los canales, no solo la app). */
export function useMasElegidos(slug: string) {
  return useQuery({
    queryKey: qk.masElegidos(slug),
    queryFn: () => api<ProductoApp[]>(`/comercios/${slug}/mas-elegidos`, { auth: 'opcional' }),
    staleTime: 5 * 60_000,
  });
}

/** "Destacados de la semana": los que el admin eligió a mano en el panel. */
export function useDestacados(slug: string) {
  return useQuery({
    queryKey: qk.destacados(slug),
    queryFn: () => api<ProductoApp[]>(`/comercios/${slug}/destacados`, { auth: 'opcional' }),
    staleTime: 5 * 60_000,
  });
}

/** Localidades habilitadas por la distribuidora. Un servidor viejo no tiene la ruta: lista vacía. */
export function useCiudades(slug: string, enabled = true) {
  return useQuery({
    queryKey: qk.ciudades(slug),
    queryFn: () => api<CiudadApp[]>(`/comercios/${slug}/ciudades`, { auth: 'opcional' }).catch(() => [] as CiudadApp[]),
    staleTime: 10 * 60_000,
    enabled,
  });
}

export function useRubros(slug: string) {
  return useQuery({
    queryKey: qk.rubros(slug),
    queryFn: () => api<string[]>(`/comercios/${slug}/rubros`, { auth: 'opcional' }),
    staleTime: 10 * 60_000,
  });
}

export function useCotizacion(slug: string, items: { productId: string; quantity: number }[], habilitada = true) {
  const clave = items.map((i) => `${i.productId}:${i.quantity}`).sort().join('|');
  return useQuery({
    queryKey: qk.cotizacion(slug, clave),
    queryFn: () => api<Cotizacion>(`/comercios/${slug}/cotizar`, { method: 'POST', body: { items } }),
    enabled: habilitada && items.length > 0,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function usePedidos(slug: string, enabled = true) {
  return useQuery({
    queryKey: qk.pedidos(slug),
    enabled,
    queryFn: () => api<PedidoResumen[]>(`/comercios/${slug}/pedidos`),
    refetchInterval: 60_000,
  });
}

export function useCuenta(slug: string, enabled = true) {
  return useQuery({ queryKey: qk.cuenta(slug), queryFn: () => api<Cuenta>(`/comercios/${slug}/cuenta`), enabled });
}

export function useCrearPedido(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { items: { productId: string; quantity: number }[]; clientRequestId: string; notas?: string }) =>
      api<PedidoCreado>(`/comercios/${slug}/pedidos`, { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pedidos(slug) });
      qc.invalidateQueries({ queryKey: qk.cuenta(slug) });
    },
  });
}

export interface OpinionApp {
  tipo: 'calificacion' | 'comentario' | 'recomendacion';
  estrellas?: number | null;
  texto?: string | null;
  origen: 'segundo_pedido' | 'periodico' | 'cuenta';
}

/** Calificación, comentario o recomendación sobre la app (la ven ServiTec y la distribuidora). */
export function useEnviarOpinion(slug: string) {
  return useMutation({
    mutationFn: (o: OpinionApp) => api<{ guardada: boolean }>(`/comercios/${slug}/opiniones`, { method: 'POST', body: { ...o, app: APP_ID ?? 'app' } }),
  });
}

/** Cancela un pedido que sigue "recibido" (el servidor rechaza si ya lo están preparando). */
export function useCancelarPedido(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pedidoId: string) =>
      api<{ cancelado: boolean }>(`/comercios/${slug}/pedidos/${encodeURIComponent(pedidoId)}/cancelar`, { method: 'POST' }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.pedidos(slug) });
      qc.invalidateQueries({ queryKey: qk.cuenta(slug) });
    },
  });
}

export function useCanjearInvitacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      api<{ slug: string; nombre: string }>('/invitaciones/canjear', { method: 'POST', body: { token } }),
    // Al vincular cambia la lista de precios (la del cliente): se refresca todo.
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** Alta sin invitación en la distribuidora del QR: crea la ficha (con el nombre del negocio) y vincula la cuenta. */
export function useAltaQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, ...body }: { slug: string; nombre: string; negocio: string }) =>
      api<{ slug: string; nombre: string }>(`/comercios/${encodeURIComponent(slug)}/alta`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** Guarda nombre del negocio, dirección, localidad y teléfono en la ficha del cliente. */
export function useGuardarDatosComercio(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosComercio) => api<{ guardado: boolean }>(`/comercios/${slug}/datos`, { method: 'PUT', body: datos }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cuenta(slug) }),
  });
}

/** Avisa un pago a la distribuidora: queda pendiente hasta que lo verifica (no baja el saldo). */
export function useInformarPago(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pago: InformarPago) => api<{ id: string }>(`/comercios/${slug}/pagos`, { method: 'POST', body: pago }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cuenta(slug) }),
  });
}

/** Última versión publicada de la app (y la mínima obligatoria), para el aviso de actualización. */
export function useVersionApp(app: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: qk.version(app ?? ''),
    queryFn: () => api<VersionPublicada | null>(`/version?app=${encodeURIComponent(app!)}`, { auth: false }),
    enabled: enabled && !!app,
    staleTime: 30 * 60_000,
  });
}

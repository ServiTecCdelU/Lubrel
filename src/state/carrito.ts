// Carrito por comercio, persistido. Guarda solo QUÉ y CUÁNTO: el precio que se
// muestra en el carrito sale siempre de /cotizar (el servidor), nunca de acá.
import { create } from 'zustand';
import { almacen } from '@/lib/almacen';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ItemCarrito {
  productId: string;
  nombre: string;
  rubro: string;
  cantidad: number;
  /** Precio del catálogo al agregarlo: solo para el total estimado mientras cotiza. */
  precioReferencia: number;
  unidadesPorBulto: number | null;
  seDivideEn: number | null;
  /** Opcional: los ítems guardados antes de tener fotos (o repetidos de un pedido) no la traen. */
  imageUrl?: string | null;
  imagenMiniUrl?: string | null;
}

type PorComercio = Record<string, Record<string, ItemCarrito>>;

interface CarritoState {
  items: PorComercio;
  /** Reintentos del mismo envío usan el mismo id (idempotencia del servidor). */
  requestIds: Record<string, string | undefined>;
  setCantidad: (slug: string, item: Omit<ItemCarrito, 'cantidad'>, cantidad: number) => void;
  vaciar: (slug: string) => void;
  setRequestId: (slug: string, id: string | undefined) => void;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set) => ({
      items: {},
      requestIds: {},
      setCantidad: (slug, item, cantidad) =>
        set((s) => {
          const actual = { ...(s.items[slug] ?? {}) };
          if (cantidad <= 0) delete actual[item.productId];
          else actual[item.productId] = { ...item, cantidad };
          // Cambiar el carrito invalida el id del envío anterior.
          return { items: { ...s.items, [slug]: actual }, requestIds: { ...s.requestIds, [slug]: undefined } };
        }),
      vaciar: (slug) =>
        set((s) => ({ items: { ...s.items, [slug]: {} }, requestIds: { ...s.requestIds, [slug]: undefined } })),
      setRequestId: (slug, id) => set((s) => ({ requestIds: { ...s.requestIds, [slug]: id } })),
    }),
    { name: 'carrito', storage: createJSONStorage(() => almacen) },
  ),
);

const VACIO: Record<string, ItemCarrito> = {};

export function useCarrito(slug: string | null) {
  return useCarritoStore((s) => (slug ? s.items[slug] ?? VACIO : VACIO));
}

// En vivo por Supabase Realtime (Broadcast público `stock:<slug>`, solo ids): la app no
// consulta cada tanto, relee solo cuando la distribuidora avisa que algo cambió.
//   - 'cambio': se movió stock, hay un producto nuevo o una oferta → catálogo, ofertas, más
//     elegidos, destacados y cotización (TanStack solo relee las que están en pantalla).
//   - 'novedad': hay un aviso nuevo para todos → la campanita.
// Varios avisos seguidos (una venta de 30 renglones) → una sola relectura.
// En segundo plano el canal se corta: si la app estuvo afuera un rato, al volver se relee lo
// de la distribuidora activa una sola vez (los avisos de ese rato se perdieron).
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { esConsultaDeStock } from '@/lib/stock-en-vivo';
import { supabase } from '@/lib/supabase';

const ESPERA_MS = 1_000;
/** Afuera de la app menos que esto, no se relee nada al volver. */
const AFUERA_MS = 2 * 60_000;

export function useStockEnVivo(slug: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!slug) return;
    let espera: ReturnType<typeof setTimeout> | null = null;
    const releerStock = () => queryClient.invalidateQueries({ predicate: (q) => esConsultaDeStock(q.queryKey, slug) });
    const canal = supabase
      .channel(`stock:${slug}`)
      .on('broadcast', { event: 'cambio' }, () => {
        if (espera) clearTimeout(espera);
        espera = setTimeout(() => void releerStock(), ESPERA_MS);
      })
      .on('broadcast', { event: 'novedad' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['notificaciones', slug] });
      })
      .subscribe();

    let afueraDesde: number | null = null;
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') {
        afueraDesde ??= Date.now();
        return;
      }
      const afuera = afueraDesde !== null && Date.now() - afueraDesde >= AFUERA_MS;
      afueraDesde = null;
      if (!afuera) return;
      void releerStock();
      void queryClient.invalidateQueries({ queryKey: ['notificaciones', slug] });
      void queryClient.invalidateQueries({ queryKey: ['pedidos', slug] });
    });
    return () => {
      if (espera) clearTimeout(espera);
      sub.remove();
      void supabase.removeChannel(canal);
    };
  }, [slug, queryClient]);
}

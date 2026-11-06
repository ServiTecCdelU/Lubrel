// Stock en vivo: la distribuidora avisa por Supabase Realtime (Broadcast público
// `stock:<slug>`, solo ids de productos) cada vez que se mueve stock. Se vuelven a pedir
// por la API las consultas que muestran stock; TanStack solo relee las que están en
// pantalla. Varios avisos seguidos (una venta de 30 renglones) → una sola relectura.
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { esConsultaDeStock } from '@/lib/stock-en-vivo';
import { supabase } from '@/lib/supabase';

const ESPERA_MS = 1_000;

export function useStockEnVivo(slug: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!slug) return;
    let espera: ReturnType<typeof setTimeout> | null = null;
    const canal = supabase
      .channel(`stock:${slug}`)
      .on('broadcast', { event: 'cambio' }, () => {
        if (espera) clearTimeout(espera);
        espera = setTimeout(() => {
          void queryClient.invalidateQueries({ predicate: (q) => esConsultaDeStock(q.queryKey, slug) });
        }, ESPERA_MS);
      })
      .subscribe();
    // En segundo plano el canal se corta y los avisos de ese rato se pierden (producto nuevo,
    // oferta, stock): al volver a la app se releen las consultas en pantalla.
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void queryClient.invalidateQueries({ predicate: (q) => esConsultaDeStock(q.queryKey, slug) });
    });
    return () => {
      if (espera) clearTimeout(espera);
      sub.remove();
      void supabase.removeChannel(canal);
    };
  }, [slug, queryClient]);
}

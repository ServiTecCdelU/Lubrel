// Pedidos y cuenta en vivo: el servidor avisa por Realtime Broadcast privado
// (`cuenta:<id de la sesión>`, solo lo escucha esta sesión) cuando cambia un pedido o la
// cuenta del comercio, y se relee solo eso. Reemplaza la consulta de pedidos cada minuto.
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/state/sesion';

export function useCuentaEnVivo(activo: boolean) {
  const { session } = useSesion();
  const queryClient = useQueryClient();
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!activo || !userId) return;
    const canal = supabase
      .channel(`cuenta:${userId}`, { config: { private: true } })
      .on('broadcast', { event: 'aviso' }, ({ payload }) => {
        const datos = (payload ?? {}) as { slug?: unknown; pedidoId?: unknown; cuenta?: unknown };
        if (typeof datos.slug !== 'string') return;
        // Vinculación de la cuenta: cambian precios, vendedor y saldo.
        if (datos.cuenta === true) {
          void queryClient.invalidateQueries();
          return;
        }
        void queryClient.invalidateQueries({ queryKey: ['pedidos', datos.slug] });
        void queryClient.invalidateQueries({ queryKey: ['notificaciones', datos.slug] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [activo, userId, queryClient]);
}

// Cuándo pedirle la opinión a la persona (en este dispositivo): después del 2.º pedido
// "¿Qué te parece la app?" y, cada tanto, "Calificá la app en Google Play". Nunca dos
// veces seguidas ni a quien ya la calificó en Play.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { almacen } from '@/lib/almacen';

const DIA = 24 * 60 * 60 * 1000;
/** Cada cuánto se vuelve a preguntar (si no calificó en Play). */
export const CADA_CUANTO = 30 * DIA;
/** Desde cuántos pedidos se pregunta cada tanto. */
const PEDIDOS_PARA_PREGUNTAR = 3;

export type PreguntaOpinion = 'segundo_pedido' | 'periodico';

interface OpinionesState {
  pedidosEnviados: number;
  ultimaPregunta: number | null;
  calificoEnPlay: boolean;
  /** Pregunta para mostrar ahora (la muestra PreguntaOpinion en el layout de la app). */
  pendiente: PreguntaOpinion | null;
  registrarPedido: () => void;
  revisarPeriodica: (ahora?: number) => void;
  respondida: () => void;
  marcarCalificoEnPlay: () => void;
}

export const useOpinionesStore = create<OpinionesState>()(
  persist(
    (set, get) => ({
      pedidosEnviados: 0,
      ultimaPregunta: null,
      calificoEnPlay: false,
      pendiente: null,
      registrarPedido: () => {
        const pedidosEnviados = get().pedidosEnviados + 1;
        set({ pedidosEnviados, ...(pedidosEnviados === 2 ? { pendiente: 'segundo_pedido' as const } : {}) });
      },
      revisarPeriodica: (ahora = Date.now()) => {
        const { pedidosEnviados, ultimaPregunta, calificoEnPlay, pendiente } = get();
        if (pendiente || calificoEnPlay || pedidosEnviados < PEDIDOS_PARA_PREGUNTAR) return;
        if (ultimaPregunta !== null && ahora - ultimaPregunta < CADA_CUANTO) return;
        set({ pendiente: 'periodico' });
      },
      respondida: () => set({ pendiente: null, ultimaPregunta: Date.now() }),
      marcarCalificoEnPlay: () => set({ calificoEnPlay: true, pendiente: null, ultimaPregunta: Date.now() }),
    }),
    {
      name: 'opiniones',
      storage: createJSONStorage(() => almacen),
      // La pregunta pendiente no sobrevive a cerrar la app.
      partialize: ({ pedidosEnviados, ultimaPregunta, calificoEnPlay }) => ({ pedidosEnviados, ultimaPregunta, calificoEnPlay }),
    },
  ),
);

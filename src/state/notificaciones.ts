// Última vez que se abrió "Notificaciones" en cada distribuidora: lo posterior cuenta como no leído.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { almacen } from '@/lib/almacen';

interface NotificacionesState {
  vistasHasta: Record<string, string>;
  marcarVistas: (slug: string) => void;
}

export const useNotificacionesVistas = create<NotificacionesState>()(
  persist(
    (set) => ({
      vistasHasta: {},
      marcarVistas: (slug) => set((s) => ({ vistasHasta: { ...s.vistasHasta, [slug]: new Date().toISOString() } })),
    }),
    { name: 'notificaciones-vistas', storage: createJSONStorage(() => almacen) },
  ),
);


// Comercio (distribuidora) activo e invitación pendiente de canjear.
// Esta app es solo de Lubrel: la distribuidora está fija y no se elige por QR ni código
// (el QR de Lubrel solo lleva a descargar la app). Vendedor 24/7 es la app de las demás.
import { create } from 'zustand';
import { almacen } from '@/lib/almacen';
import { createJSONStorage, persist } from 'zustand/middleware';

export const DISTRIBUIDORA_FIJA = 'lubrel';

export interface InvitacionPendiente {
  slug: string;
  token: string;
}

interface ComercioState {
  slugActivo: string | null;
  /** Llegó por deep link antes de loguearse: se canjea apenas hay sesión. */
  invitacion: InvitacionPendiente | null;
  /** Distribuidora de la app (siempre Lubrel): da la marca del ingreso y el modo visitante. */
  distribuidora: string | null;
  setSlugActivo: (slug: string | null) => void;
  setInvitacion: (inv: InvitacionPendiente | null) => void;
  setDistribuidora: (slug: string | null) => void;
}

const FIJA = { distribuidora: DISTRIBUIDORA_FIJA, slugActivo: DISTRIBUIDORA_FIJA };

export const useComercioStore = create<ComercioState>()(
  persist(
    (set) => ({
      ...FIJA,
      invitacion: null,
      // Cualquier intento de elegir otra (link viejo, invitación ajena) queda en Lubrel.
      setSlugActivo: () => set(FIJA),
      setInvitacion: (invitacion) => set({ invitacion: invitacion && invitacion.slug !== DISTRIBUIDORA_FIJA ? null : invitacion }),
      setDistribuidora: () => set(FIJA),
    }),
    {
      name: 'comercio',
      storage: createJSONStorage(() => almacen),
      // Instalaciones viejas pueden tener guardada otra distribuidora (o ninguna).
      merge: (guardado, actual) => ({ ...actual, ...(guardado as Partial<ComercioState>), ...FIJA }),
    },
  ),
);

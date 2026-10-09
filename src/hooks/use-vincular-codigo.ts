// Vincular la distribuidora a partir de lo que escribió o pegó la persona: el código corto
// que le dictó el vendedor ("lubrel"), el link del QR o un link de invitación. Antes de
// fijarla se comprueba que exista (un código mal tipeado avisa en vez de dejar la app
// como visitante de una distribuidora fantasma).
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queries';
import { parseQrDistribuidora } from '@/lib/qr-distribuidora';
import type { Comercio } from '@/lib/tipos';
import { useComercioStore } from '@/state/comercio';

export function useVincularCodigo() {
  const qc = useQueryClient();
  const distribuidoraActual = useComercioStore((s) => s.distribuidora);
  const setDistribuidora = useComercioStore((s) => s.setDistribuidora);
  const setInvitacion = useComercioStore((s) => s.setInvitacion);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Devuelve el mensaje de error (null si vinculó y ya navegó al inicio). También queda en `error`. */
  const vincular = async (texto: string): Promise<string | null> => {
    const falla = (mensaje: string) => {
      setError(mensaje);
      return mensaje;
    };
    setError(null);
    const qr = parseQrDistribuidora(texto);
    if (!qr) return falla('No reconocemos ese código. Pedíselo a tu vendedor o escaneá el QR de la distribuidora.');

    if (qr.tipo === 'invitacion') {
      const slug = qr.slug ?? distribuidoraActual;
      if (!slug) return falla('No reconocemos la distribuidora de esa invitación. Pegá el link completo.');
      setDistribuidora(slug);
      // Con sesión, el layout de la app la canjea solo; sin sesión queda guardada hasta registrarse.
      setInvitacion({ slug, token: qr.token });
      router.replace('/');
      return null;
    }

    setCargando(true);
    try {
      await qc.fetchQuery({
        queryKey: qk.comercio(qr.slug),
        queryFn: () => api<Comercio>(`/comercios/${encodeURIComponent(qr.slug)}`, { auth: false }),
        staleTime: 5 * 60_000,
      });
      setDistribuidora(qr.slug);
      router.replace('/');
      return null;
    } catch (e) {
      return falla(
        e instanceof ApiError && e.status === 404
          ? `No encontramos una distribuidora con el código "${qr.slug}". Revisá que esté bien escrito.`
          : e instanceof Error
            ? e.message
            : 'No pudimos comprobar el código. Probá de nuevo.',
      );
    } finally {
      setCargando(false);
    }
  };

  return { vincular, cargando, error, limpiarError: () => setError(null) };
}

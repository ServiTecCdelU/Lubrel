// Tira "Sin conexión" arriba de todo cuando el celular pierde internet. El carrito queda
// guardado en el dispositivo y, al volver la conexión, TanStack Query reintenta solo
// (onlineManager conectado a expo-network en src/app/_layout.tsx).
//
// Android avisa "sin internet" (isInternetReachable = false) por cualquier cosa: al pasar de
// wifi a datos, si su chequeo propio tarda, con redes que bloquean ese chequeo. Por eso el
// cartel no se prende con el primer aviso: espera unos segundos y, si el celular dice que está
// conectado, confirma pegándole a nuestro servidor. Solo si eso también falla, avisa.
import { useNetworkState } from 'expo-network';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icono, T } from '@/components/ui';
import { env } from '@/lib/env';
import { colors, fonts } from '@/theme';

/** Cuánto tiene que durar la falta de red antes de mostrar el cartel. */
const ESPERA_MS = 4_000;
/** Mientras el cartel está prendido, cada cuánto se vuelve a probar. */
const REINTENTO_MS = 15_000;
const TIMEOUT_PRUEBA_MS = 6_000;

/** ¿Llega al servidor? Cualquier respuesta (aunque sea un error) quiere decir que hay internet. */
async function llegaAlServidor(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_PRUEBA_MS);
  try {
    await fetch(`${env.apiUrl}/api/app/v1/config`, { signal: controller.signal, cache: 'no-store' });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function SinConexion() {
  const red = useNetworkState();
  const insets = useSafeAreaInsets();
  const [sinConexion, setSinConexion] = useState(false);

  // Sin red del todo (modo avión, sin wifi ni datos) vs. "conectado pero Android duda".
  // Solo con un "false" explícito: mientras se mide (undefined) no cuenta.
  const desconectado = red.isConnected === false;
  const dudoso = !desconectado && red.isInternetReachable === false;

  useEffect(() => {
    if (!desconectado && !dudoso) return;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;
    const revisar = async () => {
      const caido = desconectado || !(await llegaAlServidor());
      if (cancelado) return;
      setSinConexion(caido);
      if (caido) timer = setTimeout(revisar, REINTENTO_MS);
    };
    timer = setTimeout(revisar, ESPERA_MS);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [desconectado, dudoso]);

  // Al volver la red se apaga en el acto, sin esperar otra prueba.
  if (!sinConexion || (!desconectado && !dudoso)) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 6, paddingBottom: 6, paddingHorizontal: 16, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
    >
      <Icono name="wifi-off" size={16} color={colors.white} />
      <T style={{ color: colors.white, fontFamily: fonts.bodyMedium, fontSize: 13 }}>Sin conexión. Tu carrito queda guardado.</T>
    </View>
  );
}

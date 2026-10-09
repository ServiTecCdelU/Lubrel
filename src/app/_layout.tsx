// El monitoreo se importa primero: así atrapa errores de todo lo que se carga después.
import { envolverApp, monitorearUsuario, navegacionSentry } from '@/lib/monitoreo';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { onlineManager, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { addNetworkStateListener } from 'expo-network';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AvisoActualizacion } from '@/components/aviso-actualizacion';
import { SinConexion } from '@/components/sin-conexion';
import { useHidratado } from '@/hooks/use-hidratado';
import { ApiError } from '@/lib/api';
import { useComercioStore } from '@/state/comercio';
import { SesionProvider, useSesion } from '@/state/sesion';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Sin internet las consultas esperan en vez de fallar, y se reintentan al volver la conexión.
onlineManager.setEventListener((setOnline) => {
  const sub = addNetworkStateListener((s) => setOnline(s.isConnected !== false));
  return () => sub.remove();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Errores de negocio (4xx) no se reintentan: no van a cambiar solos.
      retry: (intentos, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && intentos < 2,
    },
  },
});

function Navegacion() {
  const { session, cargando } = useSesion();
  const distribuidora = useComercioStore((s) => s.distribuidora);
  const [fuentes, errorFuentes] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });
  const hidratado = useHidratado();
  const listo = (fuentes || !!errorFuentes) && !cargando && hidratado;
  const qc = useQueryClient();
  const navegacion = useNavigationContainerRef();

  // Sentry nombra la pantalla de cada error con las rutas de expo-router.
  useEffect(() => {
    navegacionSentry.registerNavigationContainer(navegacion);
  }, [navegacion]);

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  // Al cerrar sesión no queda nada de la cuenta anterior en memoria.
  useEffect(() => {
    if (!cargando && !session) qc.clear();
  }, [cargando, session, qc]);

  useEffect(() => {
    if (!cargando) monitorearUsuario(session?.user.id ?? null);
  }, [cargando, session]);

  if (!listo) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        {/* El orden importa: si la ruta actual queda protegida se va a la primera disponible. */}
        <Stack.Protected guard={!session && !distribuidora}>
          <Stack.Screen name="bienvenida" />
        </Stack.Protected>
        {/* Con sesión, o como visitante de la distribuidora cuyo QR escaneó. */}
        <Stack.Protected guard={!!session || !!distribuidora}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="ingresar" />
        </Stack.Protected>
        {/* Destinos de QR/links y del ingreso con Google: accesibles con o sin sesión. */}
        <Stack.Screen name="invitacion" />
        <Stack.Screen name="a/[slug]" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="escanear-qr" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack>
      {/* Encima de cualquier pantalla (también bienvenida e ingreso). */}
      <AvisoActualizacion />
      <SinConexion />
    </>
  );
}

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SesionProvider>
        <StatusBar style="dark" />
        <Navegacion />
      </SesionProvider>
    </QueryClientProvider>
  );
}

export default envolverApp(RootLayout);

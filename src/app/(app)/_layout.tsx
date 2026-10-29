// Zona de la app. Sin sesión, con la distribuidora del QR, entra como visitante. Al
// registrarse se le pide su nombre y el del supermercado, se da de alta en esa
// distribuidora (sin invitación) y ve la app completa.
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HojaAlta } from '@/components/alta-comercio';
import { PreguntaOpinion } from '@/components/opinion';
import { Aviso, Boton, Cargando } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { useNotificacionesPush } from '@/hooks/use-notificaciones-push';
import { cerrarSesion } from '@/lib/notificaciones';
import { useCanjearInvitacion } from '@/lib/queries';
import { useComercioStore } from '@/state/comercio';
import { useRegistroStore } from '@/state/registro';
import { colors } from '@/theme';

export default function AppLayout() {
  const { comercios, visitante, conSesion, cargando, error, refetch, accent, slug: slugActivo } = useComercioActivo();
  const invitacion = useComercioStore((s) => s.invitacion);
  const setInvitacion = useComercioStore((s) => s.setInvitacion);
  const setSlugActivo = useComercioStore((s) => s.setSlugActivo);
  const distribuidora = useComercioStore((s) => s.distribuidora);
  const canjear = useCanjearInvitacion();
  const canjeando = useRef<string | null>(null);
  const { altaVisible, abrirAlta, cerrarAlta } = useRegistroStore();
  const altaIntentada = useRef<string | null>(null);
  const tieneComercio = comercios.length > 0;
  useNotificacionesPush(conSesion && tieneComercio);

  useEffect(() => {
    // Sin sesión la invitación queda guardada hasta que se registre.
    if (!conSesion || !invitacion || canjeando.current === invitacion.token) return;
    canjeando.current = invitacion.token;
    canjear.mutate(invitacion.token, {
      onSuccess: (r) => {
        setSlugActivo(r.slug);
        setInvitacion(null);
      },
      // El error queda en canjear.error y lo muestra "sin-comercio"; la invitación se descarta
      // para no reintentar en loop un token vencido o ya usado.
      onError: () => setInvitacion(null),
    });
  }, [conSesion, invitacion, canjear, setInvitacion, setSlugActivo]);

  // Registrado, con la distribuidora del QR y sin ficha en ELLA (aunque tenga otros
  // comercios): se abre la hoja de alta (una vez por distribuidora; si la cierra queda
  // como visitante y el banner la vuelve a abrir).
  const qrVinculado = !!distribuidora && comercios.some((c) => c.slug === distribuidora);
  useEffect(() => {
    if (!conSesion || cargando || error || qrVinculado || invitacion || !distribuidora) return;
    if (altaIntentada.current === distribuidora) return;
    altaIntentada.current = distribuidora;
    abrirAlta();
  }, [conSesion, cargando, error, qrVinculado, invitacion, distribuidora, abrirAlta]);

  if (cargando || canjear.isPending) return <Cargando />;

  // Si /me falla (sin conexión, API caída, CORS en web) NO es "sin comercio": se muestra el error.
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 24, gap: 16, justifyContent: 'center' }}>
        <Aviso texto={`No pudimos cargar tus comercios: ${error.message}`} />
        <Boton onPress={() => refetch()}>Reintentar</Boton>
        <Boton variante="borde" onPress={cerrarSesion}>Salir</Boton>
      </SafeAreaView>
    );
  }

  const puedeNavegar = tieneComercio || visitante;
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={puedeNavegar}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="escanear" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        </Stack.Protected>
        <Stack.Protected guard={tieneComercio}>
          <Stack.Screen name="pedidos/[id]" />
        </Stack.Protected>
        {/* También desde el modo visitante con sesión, para vincular el comercio. */}
        <Stack.Protected guard={conSesion && !tieneComercio}>
          <Stack.Screen name="sin-comercio" initialParams={{ error: canjear.error?.message ?? '' }} />
        </Stack.Protected>
      </Stack>
      <HojaAlta
        visible={altaVisible && conSesion && !qrVinculado}
        slug={distribuidora}
        accent={accent}
        onCerrar={cerrarAlta}
        onListo={(slug) => {
          cerrarAlta();
          setSlugActivo(slug);
        }}
      />
      {/* "¿Qué te parece la app?" después del 2.º pedido y "Calificá la app" cada tanto. */}
      {tieneComercio && !visitante && slugActivo && <PreguntaOpinion slug={slugActivo} accent={accent} />}
    </>
  );
}

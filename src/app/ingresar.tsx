// Ingreso con Google, con el estilo del login del panel: tarjeta centrada.
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { URL_PRIVACIDAD } from '@/components/eliminar-cuenta';
import { LogoMarca } from '@/components/logo-marca';
import { columnaLectura } from '@/components/marco-app';
import { Aviso, Boton, Icono, T, Tarjeta } from '@/components/ui';
import { ingresarConGoogle } from '@/lib/google';
import { useComercioPublico } from '@/lib/queries';
import { useComercioStore } from '@/state/comercio';
import { ACCENT_DEFAULT, colors, fonts, radius, tint } from '@/theme';

export default function Ingresar() {
  const invitacion = useComercioStore((s) => s.invitacion);
  const distribuidora = useComercioStore((s) => s.distribuidora);
  const marca = useComercioPublico(invitacion?.slug ?? distribuidora ?? undefined);
  const accent = marca.data?.colorPrimario || ACCENT_DEFAULT;

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Con sesión, el layout raíz lleva solo a la app (Stack.Protected).
  const google = async () => {
    setError(null);
    setEnviando(true);
    try {
      await ingresarConGoogle();
    } catch {
      setError('No pudimos ingresar con Google. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[columnaLectura, { maxWidth: 520, flexGrow: 1, justifyContent: 'center', padding: 20, gap: 20 }]}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          {marca.data ? (
            <LogoMarca nombre={marca.data.nombre} logoUrl={marca.data.logoUrl} color={accent} size={72} />
          ) : (
            <View style={{ width: 52, height: 52, borderRadius: radius.lg, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icono name="storefront-outline" color={colors.white} size={26} />
            </View>
          )}
          <T v="titulo" style={{ textAlign: 'center' }}>{marca.data?.nombre ?? 'Lubrel'}</T>
          <T v="chico" style={{ textAlign: 'center', fontSize: 14 }}>
            {invitacion ? 'Tu vendedor te invitó a hacer los pedidos desde el celular.' : 'Hacé tus pedidos, mirá su estado y tu cuenta corriente.'}
          </T>
        </View>

        <Tarjeta style={{ gap: 14, padding: 20 }}>
          <View style={{ gap: 4 }}>
            <T v="h2">Ingresar</T>
            <T v="chico">Con tu cuenta de Google. Sin contraseñas ni códigos.</T>
          </View>
          {error && <Aviso texto={error} />}
          <Boton color={accent} icono="google" onPress={google} cargando={enviando}>
            Continuar con Google
          </Boton>
          <T v="chico" style={{ fontSize: 12, textAlign: 'center' }}>
            Al continuar aceptás la{' '}
            <T v="chico" accessibilityRole="link" onPress={() => Linking.openURL(URL_PRIVACIDAD)} style={{ fontSize: 12, textDecorationLine: 'underline' }}>
              Política de privacidad
            </T>
            .
          </T>
        </Tarjeta>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/escanear-qr')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: tint(accent, 0.06) }}
        >
          <Icono name={invitacion ? 'check-circle-outline' : 'qrcode-scan'} color={accent} size={18} />
          <T v="chico" style={{ flex: 1 }}>
            {invitacion
              ? 'Invitación lista: al ingresar, tu comercio queda vinculado.'
              : distribuidora
                ? `Distribuidora: ${marca.data?.nombre ?? distribuidora}.`
                : 'Escaneá el QR de tu distribuidora.'}
          </T>
          <T style={{ color: accent, fontFamily: fonts.bodyMedium, fontSize: 14 }}>
            {invitacion || distribuidora ? 'Cambiar' : 'Escanear'}
          </T>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

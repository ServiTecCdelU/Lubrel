// Logueado pero sin distribuidora elegida: escanear su QR, o escribir el código que le dio
// el vendedor (también sirve el link del QR o uno de invitación). Con eso el layout de (app)
// hace el alta automática o canjea la invitación.
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CodigoDistribuidora } from '@/components/codigo-distribuidora';
import { columnaLectura } from '@/components/marco-app';
import { Aviso, Boton, Icono, T } from '@/components/ui';
import { cerrarSesion } from '@/lib/notificaciones';
import { ACCENT_DEFAULT, colors, radius, tint } from '@/theme';

export default function SinComercio() {
  const { error: errorInicial } = useLocalSearchParams<{ error?: string }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[columnaLectura, { maxWidth: 520, padding: 20, gap: 16, flexGrow: 1, justifyContent: 'center' }]} keyboardShouldPersistTaps="handled">
        <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(ACCENT_DEFAULT), alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="store-plus-outline" size={26} color={ACCENT_DEFAULT} />
        </View>
        <View style={{ gap: 6 }}>
          <T v="h1">Elegí tu distribuidora</T>
          <T v="chico" style={{ fontSize: 14 }}>
            Escaneá el QR de tu distribuidora o escribí el código que te dio tu vendedor. Quedás registrado como cliente al instante.
          </T>
        </View>

        {errorInicial ? <Aviso texto={errorInicial} /> : null}

        <Boton icono="qrcode-scan" onPress={() => router.push('/escanear-qr')}>
          Escanear QR de la distribuidora
        </Boton>

        <CodigoDistribuidora accent={ACCENT_DEFAULT} />

        {router.canGoBack() ? (
          <Boton variante="borde" onPress={() => router.back()}>
            Volver
          </Boton>
        ) : (
          <Boton variante="borde" icono="logout" onPress={cerrarSesion}>
            Salir
          </Boton>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

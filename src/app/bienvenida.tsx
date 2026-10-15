// Primera pantalla: todavía no hay distribuidora elegida ni sesión. Escanear el QR de la
// distribuidora alcanza para entrar como visitante; registrarse es después.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CodigoDistribuidora } from '@/components/codigo-distribuidora';
import { columnaLectura } from '@/components/marco-app';
import { Boton, Icono, T } from '@/components/ui';
import { ACCENT_DEFAULT, colors, fonts, radius, tint } from '@/theme';

export default function Bienvenida() {
  const [conCodigo, setConCodigo] = useState(false);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[columnaLectura, { maxWidth: 520, flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 }]} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={{ width: 64, height: 64, borderRadius: radius.lg, backgroundColor: ACCENT_DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="storefront-outline" color={colors.white} size={32} />
          </View>
          <T v="titulo" style={{ textAlign: 'center' }}>Vendedor 24</T>
          <T v="chico" style={{ textAlign: 'center', fontSize: 15 }}>
            Escaneá el QR de tu distribuidora para ver sus productos y ofertas.
          </T>
        </View>

        <View style={{ padding: 16, borderRadius: radius.md, backgroundColor: tint(ACCENT_DEFAULT, 0.06), gap: 10 }}>
          {[
            ['qrcode-scan', 'Escaneá el QR o subí una foto del QR'],
            ['tag-outline', 'Mirá el catálogo y las promos al instante'],
            ['account-plus-outline', 'Registrate cuando quieras para pedir'],
          ].map(([icono, texto]) => (
            <View key={texto} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icono name={icono as 'qrcode-scan'} color={ACCENT_DEFAULT} size={20} />
              <T v="chico" style={{ flex: 1, fontSize: 14 }}>{texto}</T>
            </View>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Boton color={ACCENT_DEFAULT} icono="qrcode-scan" onPress={() => router.push('/escanear-qr')}>
            Escanear QR de la distribuidora
          </Boton>
          {conCodigo ? (
            <CodigoDistribuidora accent={ACCENT_DEFAULT} autoFoco />
          ) : (
            <Boton variante="borde" icono="keyboard-outline" onPress={() => setConCodigo(true)}>
              Tengo un código
            </Boton>
          )}
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/ingresar')} style={{ alignSelf: 'center', padding: 8 }}>
          <T style={{ color: ACCENT_DEFAULT, fontFamily: fonts.bodyMedium, fontSize: 14 }}>Ya tengo cuenta · Ingresar</T>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

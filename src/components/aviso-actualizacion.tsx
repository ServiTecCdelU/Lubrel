// Cartel "¡La app se actualizó!": compara el versionCode instalado con el que publica el SaaS
// (Superadmin → App). Si la instalada es más vieja que la última, avisa y se puede cerrar
// ("Más tarde", vuelve a aparecer al abrir la app de nuevo). Si es más vieja que la mínima,
// no se puede cerrar: hay que actualizar. En la web no aparece (no hay versión instalada).
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Modal, View } from 'react-native';
import { anchoHoja } from '@/components/marco-app';
import { Boton, Icono, T } from '@/components/ui';
import { useVersionApp } from '@/lib/queries';
import { abrirTienda, APP_ID } from '@/lib/tienda';
import { estadoVersion, versionInstalada } from '@/lib/version-app';
import { colors, radius, tarjetaBase, tint } from '@/theme';

const INSTALADA = versionInstalada(Application.nativeBuildVersion);

export function AvisoActualizacion() {
  const version = useVersionApp(APP_ID, INSTALADA !== null);
  const [cerrado, setCerrado] = useState(false);
  const estado = estadoVersion(INSTALADA, version.data);
  const obligatoria = estado === 'obligatoria';

  if (estado === 'al-dia' || (cerrado && !obligatoria)) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => !obligatoria && setCerrado(true)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', padding: 20 }}>
        <View style={[tarjetaBase, anchoHoja, { padding: 20, gap: 14, borderRadius: radius.lg }]}>
          <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(colors.tealInk, 0.1), alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="cellphone-arrow-down" size={26} color={colors.tealInk} />
          </View>
          <View style={{ gap: 6 }}>
            <T v="h2">¡{Constants.expoConfig?.name ?? 'La app'} se actualizó!</T>
            <T v="chico" style={{ fontSize: 14, lineHeight: 20 }}>
              {obligatoria
                ? 'Para seguir haciendo pedidos tenés que actualizar la app. Es gratis y tarda un minuto.'
                : 'Hay una versión nueva con mejoras. Actualizala desde Google Play para que todo funcione bien.'}
            </T>
          </View>
          <View style={{ gap: 8 }}>
            <Boton icono="google-play" onPress={() => abrirTienda(version.data?.urlTienda ?? null)}>
              Actualizar ahora
            </Boton>
            {!obligatoria && (
              <Boton variante="borde" onPress={() => setCerrado(true)}>
                Más tarde
              </Boton>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

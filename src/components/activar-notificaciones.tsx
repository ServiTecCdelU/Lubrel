// Cartel "Activar notificaciones" del inicio: aparece si el celular no da permiso para los
// avisos o si los silenciaron (canal de Android sin sonido). Se vuelve a revisar cada vez que la
// app vuelve al frente (por ejemplo, después de cambiarlo en Ajustes).
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, View } from 'react-native';
import { Boton, Icono, T } from '@/components/ui';
import { CANAL_AVISOS, crearCanal, registrarDispositivo } from '@/lib/notificaciones';
import { colors, radius, tint } from '@/theme';

type Estado = 'ok' | 'pedir' | 'ajustes';

async function revisar(): Promise<Estado> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'ok';
  const permiso = await Notifications.getPermissionsAsync();
  if (!permiso.granted) return permiso.canAskAgain ? 'pedir' : 'ajustes';
  if (Platform.OS === 'android') {
    await crearCanal();
    const canal = await Notifications.getNotificationChannelAsync(CANAL_AVISOS);
    // Silenciado desde Ajustes: llega pero sin sonido ni cartel.
    if (canal && canal.importance < Notifications.AndroidImportance.DEFAULT) return 'ajustes';
  }
  return 'ok';
}

export function ActivarNotificaciones({ accent }: { accent: string }) {
  const [estado, setEstado] = useState<Estado>('ok');

  const actualizar = useCallback(() => {
    revisar()
      .then(setEstado)
      .catch(() => setEstado('ok'));
  }, []);

  useEffect(() => {
    actualizar();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && actualizar());
    return () => sub.remove();
  }, [actualizar]);

  if (estado === 'ok') return null;

  const activar = async () => {
    if (estado === 'ajustes') {
      await Linking.openSettings();
      return;
    }
    const permiso = await Notifications.requestPermissionsAsync();
    if (permiso.granted) await registrarDispositivo().catch(() => {});
    actualizar();
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: tint(accent, 0.35), backgroundColor: tint(accent, 0.08) }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name="bell-ring-outline" size={22} color={colors.white} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="fuerte" style={{ fontSize: 15 }}>Activá las notificaciones</T>
        <T v="chico" style={{ fontSize: 13 }}>
          {estado === 'ajustes' ? 'Están apagadas o sin sonido. Prendelas en Ajustes para enterarte de tus pedidos y ofertas.' : 'Enterate al momento cuando tu pedido avanza y cuando hay ofertas.'}
        </T>
      </View>
      <Boton chico color={accent} onPress={activar}>
        {estado === 'ajustes' ? 'Ajustes' : 'Activar'}
      </Boton>
    </View>
  );
}
